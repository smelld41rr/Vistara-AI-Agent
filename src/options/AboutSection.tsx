/* Vistara AI modification, 2026-11-02: branding/privacy changes; see NOTICE and docs/CHANGED_FILES.md. */
// Settings → About: the version, the project's licence, the website, and the open-source packages the extension ships with theirs.
import { SettingsCard } from './SettingsCard';
import { t } from '@src/ui/i18n';
import { LICENCES } from './licences';
import { websiteUrl } from '@src/ui/links';

export function AboutSection() {
  const manifest = chrome.runtime.getManifest();
  return (
    <div className="flex flex-col gap-6">
      <h2 className="sr-only">{t('settings.nav.about')}</h2>
      <SettingsCard title="Vistara AI" className="flex flex-col gap-1">
        <p className="text-sm">{t('about.version', { version: manifest.version })}</p>
        <p className="text-sm text-nb-muted">{t('about.license', { license: 'Apache-2.0' })}</p>
        <p className="text-sm">
          {t('about.website')}{' '}
          <a className="text-nb-link underline" href={websiteUrl('/', 'about')} target="_blank" rel="noreferrer">
            Vistara AI source
          </a>
        </p>
      </SettingsCard>
      <SettingsCard title="Source attribution">
        <p className="text-sm text-nb-muted">
          Based on NanoBrowser, Apache-2.0, commit 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458. Modified for Vistara AI; no
          upstream endorsement.
        </p>
        <a
          className="text-sm text-nb-link underline"
          href="https://github.com/nanobrowser/nanobrowser"
          target="_blank"
          rel="noreferrer">
          Original open-source project
        </a>
      </SettingsCard>
      <SettingsCard title={t('about.licences')}>
        <ul className="flex flex-col gap-1 text-sm">
          {LICENCES.map(l => (
            <li key={l.name} className="flex flex-wrap gap-x-2">
              <a className="break-all font-mono text-nb-link underline" href={l.url} target="_blank" rel="noreferrer">
                {l.name}
              </a>
              <span className="text-nb-muted">{l.licence}</span>
            </li>
          ))}
        </ul>
      </SettingsCard>
    </div>
  );
}
