import { config } from '../config';
import { prisma } from '../prisma';
import { sendMail } from './email';
import { getAppSettings } from './settings';

/**
 * Push notifications via the OneSignal REST API.
 *
 * The mobile app calls `OneSignal.login(user.id)` after sign-in, so a user's
 * OneSignal **external id === our `User.id`**. That lets the backend target a
 * specific person by id without storing device tokens.
 *
 * All senders are fire-and-forget: they never throw, so a push failure can't
 * break the HTTP request that triggered it. Call them with `void` after the
 * response has been sent.
 */

const ONESIGNAL_API = 'https://api.onesignal.com/notifications';

interface PushMessage {
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/** Low-level send: push to the given users (by external id = User.id). */
async function sendPushToUsers(userIds: string[], msg: PushMessage): Promise<void> {
  const recipients = [...new Set(userIds)].filter(Boolean);
  if (recipients.length === 0) return;
  if (!config.oneSignalAppId || !config.oneSignalApiKey) {
    console.warn('[push] OneSignal not configured (ONESIGNAL_APP_ID / ONESIGNAL_KEY) — skipping');
    return;
  }

  try {
    const res = await fetch(ONESIGNAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${config.oneSignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: config.oneSignalAppId,
        target_channel: 'push',
        include_aliases: { external_id: recipients },
        headings: { en: msg.title },
        contents: { en: msg.message },
        ...(msg.data ? { data: msg.data } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[push] OneSignal responded ${res.status}: ${body}`);
    }
  } catch (err) {
    console.error('[push] Failed to send OneSignal notification:', err);
  }
}

/**
 * Notify all admins that an employee submitted OT for review — via push always,
 * and via email when the admin-configurable `emailOnOtSubmit` setting is on.
 * The submitter is excluded (an admin logging their own OT shouldn't ping themselves).
 */
export async function notifyAdminsOfNewOtRequest(params: {
  submitterId: string;
  submitterName: string;
  submitterEmail: string;
  count: number;
}): Promise<void> {
  if (config.adminEmails.length === 0) return;
  const admins = await prisma.user.findMany({
    where: { email: { in: config.adminEmails } },
    select: { id: true },
  });
  const recipients = admins.map((a) => a.id).filter((id) => id !== params.submitterId);
  const n = params.count;
  const plural = n > 1 ? 's' : '';

  await sendPushToUsers(recipients, {
    title: 'New OT request',
    message: `${params.submitterName} submitted ${n} OT request${plural} for review.`,
    data: { type: 'ot_submitted' },
  });

  // Email admins too, if enabled. Email goes to the configured admin addresses
  // (not the submitter, even if they are an admin).
  const settings = await getAppSettings();
  if (settings.emailOnOtSubmit) {
    const to = config.adminEmails.filter((e) => e !== params.submitterEmail.toLowerCase());
    const link = `${config.webAppUrl}/admin`;
    await sendMail({
      to,
      subject: `New OT request from ${params.submitterName}`,
      text:
        `${params.submitterName} (${params.submitterEmail}) submitted ${n} OT request${plural} for review.\n\n` +
        `Review them here: ${link}`,
      html:
        `<p><strong>${params.submitterName}</strong> (${params.submitterEmail}) submitted ` +
        `<strong>${n}</strong> OT request${plural} for review.</p>` +
        `<p><a href="${link}">Review in OT Tracker</a></p>`,
    });
  }
}

/** Notify the request owner that an admin approved or rejected their OT. */
export async function notifyOwnerOfReview(params: {
  ownerId: string;
  requestId: string;
  status: 'APPROVED' | 'REJECTED';
  workDate: string;
  projectName?: string;
  note?: string | null;
}): Promise<void> {
  const verb = params.status === 'APPROVED' ? 'approved' : 'rejected';
  const project = params.projectName ? ` (${params.projectName})` : '';
  let message = `Your OT on ${params.workDate}${project} was ${verb}.`;
  if (params.note) message += ` Note: ${params.note}`;
  await sendPushToUsers([params.ownerId], {
    title: `OT ${verb}`,
    message,
    // `otRequestId` lets the app deep-link to this request (see mobile onesignal.ts).
    data: { type: 'ot_reviewed', status: params.status, otRequestId: params.requestId },
  });
}
