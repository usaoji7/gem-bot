"use client";

import { useLanguage } from '../../context/LanguageContext';

export default function FAQ() {
  const { t } = useLanguage();

  return (
    <div className="doc-container">
      <h1 className="doc-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>{t('faq.title')}</h1>

      <div className="doc-section" style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <h2 style={{ borderBottom: 'none', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{t('faq.q1')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.8' }}>{t('faq.a1')}</p>

        <h2 style={{ borderBottom: 'none', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{t('faq.q2')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.8' }}>{t('faq.a2')}</p>

        <h2 style={{ borderBottom: 'none', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{t('faq.q3')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.8' }}>{t('faq.a3')}</p>

        <h2 style={{ borderBottom: 'none', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{t('faq.q4')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.8' }}>{t('faq.a4')}</p>

        <h2 style={{ borderBottom: 'none', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{t('faq.q5')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0', lineHeight: '1.8' }}>{t('faq.a5')}</p>
      </div>
    </div>
  );
}
