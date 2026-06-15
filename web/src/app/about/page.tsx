"use client";

import { useLanguage } from '../../context/LanguageContext';

export default function AboutUs() {
  const { t } = useLanguage();

  return (
    <div className="doc-container">
      <h1 className="doc-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>{t('about.title')}</h1>

      <div className="feature-card" style={{ marginBottom: '3rem', borderTop: '4px solid var(--accent-primary)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>✉️ {t('about.msg.title')}</h2>
        
        <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '1.5rem', fontStyle: 'italic', textAlign: 'center' }}>
          {t('about.msg.quote')}
        </h3>
        
        <p style={{ marginBottom: '1rem', lineHeight: '1.8' }}>{t('about.msg.p1')}</p>
        <p style={{ marginBottom: '1rem', lineHeight: '1.8' }}>{t('about.msg.p2')}</p>
        <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2rem', textAlign: 'center' }}>
          {t('about.msg.p3')}
        </p>
      </div>

    </div>
  );
}
