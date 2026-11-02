/* Vistara AI modification, 2026-11-02: branding/privacy changes; see NOTICE and docs/CHANGED_FILES.md. */
// Vistara modification: no production telemetry destination and no misleading opt-in controls.
import { t } from '@src/ui/i18n';
import { SettingsCard } from './SettingsCard';
export const PRIVACY_URL = 'https://github.com/smelld41rr/Vistara-AI-Agent/blob/main/PRIVACY.md';
export function PrivacyCard() {
  return (
    <SettingsCard title={t('privacy.title')} className="flex flex-col gap-4">
      <p className="text-sm text-nb-muted">{t('privacy.disabled')}</p>
      <a className="self-start text-sm text-nb-accent underline" href={PRIVACY_URL} target="_blank" rel="noreferrer">
        {t('privacy.policy')}
      </a>
    </SettingsCard>
  );
}
