import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage, fetchAdminSettings, updateAdminSettings } from '../api/client';
import type { AppSettings } from '../types';

/**
 * Admin "Settings" tab data + mutations. Owns loading, the current settings,
 * and per-setting updates; the component only renders and toggles.
 */
export function useAdminSettings() {
  const { enqueueSnackbar } = useSnackbar();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAdminSettings()
      .then((s) => !cancelled && setSettings(s))
      .catch((err) => {
        if (!cancelled) enqueueSnackbar(apiErrorMessage(err, 'Failed to load settings'), { variant: 'error' });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  const update = useCallback(
    async (patch: Partial<AppSettings>) => {
      setSaving(true);
      try {
        setSettings(await updateAdminSettings(patch));
        enqueueSnackbar('Settings saved.', { variant: 'success' });
      } catch (err) {
        enqueueSnackbar(apiErrorMessage(err, 'Failed to save settings'), { variant: 'error' });
      } finally {
        setSaving(false);
      }
    },
    [enqueueSnackbar],
  );

  return { settings, loading, saving, update };
}
