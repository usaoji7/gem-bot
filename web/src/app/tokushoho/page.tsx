"use client";

import { useLanguage } from '../../context/LanguageContext';

export default function Tokushoho() {
  const { t } = useLanguage();

  return (
    <div className="doc-container">
      <h1 className="doc-title">{t('tokushoho.title')}</h1>

      <div className="doc-section" style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '16px', marginTop: '2rem' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>事業者・プロジェクト名</span>
            <strong>{t('about.info.name')}</strong>
          </li>
          <li style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>代表者</span>
            <strong>{t('about.info.rep')}</strong>
          </li>
          <li style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>設立</span>
            <strong>{t('about.info.est')}</strong>
          </li>
          <li style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>所在地</span>
            <strong>{t('about.info.loc')}</strong>
          </li>
          <li style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>お問い合わせ先</span>
            <strong>{t('about.info.contact')}</strong>
          </li>
        </ul>
      </div>
    </div>
  );
}
