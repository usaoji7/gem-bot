"use client";

import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear().toString();

  return (
    <footer className="footer" style={{ padding: '3rem 1rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>{t('nav.terms')}</Link>
        <Link href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>{t('nav.privacy')}</Link>
        <Link href="/tokushoho" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>{t('nav.tokushoho')}</Link>
      </div>
      <p className="footer-text" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        {t('footer.rights').replace('{year}', year)}
      </p>
    </footer>
  );
}
