import { prisma } from '../prisma';

/**
 * App settings are stored as a single row (id = 1). These helpers always
 * read/write that row, creating it with schema defaults on first access.
 */

const SETTINGS_ID = 1;

export async function getAppSettings() {
  return prisma.appSetting.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

export async function updateAppSettings(patch: { emailOnOtSubmit?: boolean }) {
  return prisma.appSetting.upsert({
    where: { id: SETTINGS_ID },
    update: patch,
    create: { id: SETTINGS_ID, ...patch },
  });
}
