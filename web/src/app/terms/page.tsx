"use client";

import { useLanguage } from '../../context/LanguageContext';

export default function Terms() {
  const { t } = useLanguage();

  return (
    <div className="doc-container">
      <h1 className="doc-title">{t('terms.title')}</h1>
      <span className="doc-date">{t('terms.updated')}</span>

      <p style={{ marginTop: '2rem', marginBottom: '3rem', lineHeight: '1.8' }}>
        {t('terms.intro')}
      </p>

      <div className="doc-section" style={{ background: 'var(--bg-secondary)', borderLeft: '4px solid #ef4444' }}>
        <h2 style={{ color: '#ef4444' }}>⚠️ {t('terms.beta.title')}</h2>
        <p style={{ fontWeight: 'bold' }}>{t('terms.beta.desc')}</p>
      </div>

      <div className="doc-section">
        <h2>{t('terms.sec1.title')}</h2>
        <p>{t('terms.sec1.desc1')}</p>
        {t('terms.sec1.desc2') && <p>{t('terms.sec1.desc2')}</p>}
      </div>

      <div className="doc-section">
        <h2>{t('terms.sec2.title')}</h2>
        <p>{t('terms.sec2.desc1')}</p>
        <p>{t('terms.sec2.desc2')}</p>
        <p>{t('terms.sec2.desc3')}</p>
        <p>{t('terms.sec2.desc4')}</p>
      </div>

      <div className="doc-section">
        <h2>{t('terms.sec3.title')}</h2>
        <p>{t('terms.sec3.desc1')}</p>
        <p style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)' }}>
          {t('terms.sec3.desc2')}
        </p>
      </div>

      <div className="doc-section">
        <h2>{t('terms.sec4.title')}</h2>
        <p>{t('terms.sec4.desc1')}</p>
        <ul>
          <li>{t('terms.sec4.li1')}</li>
          <li>{t('terms.sec4.li2')}</li>
          <li>{t('terms.sec4.li3')}</li>
          {t('terms.sec4.li4') && <li>{t('terms.sec4.li4')}</li>}
        </ul>
      </div>

      <div className="doc-section">
        <h2>{t('terms.sec5.title')}</h2>
        <p>{t('terms.sec5.desc1')}</p>
        <p>{t('terms.sec5.desc2')}</p>
      </div>

      <div className="doc-section">
        <h2>{t('terms.sec6.title')}</h2>
        <p>{t('terms.sec6.desc1')}</p>
        <p>{t('terms.sec6.desc2')}</p>
      </div>
    </div>
  );
}
