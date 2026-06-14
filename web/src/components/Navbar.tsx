"use client";

import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link href="/">GEM BOT</Link>
      </div>
      <div className="navbar-links" style={{ alignItems: 'center' }}>
        <Link href="/#features">{t('nav.features')}</Link>
        <Link href="/#pricing">{t('nav.pricing')}</Link>
        <Link href="/commands">{t('nav.commands')}</Link>
        <Link href="/faq">{t('nav.faq')}</Link>
        <Link href="/about">{t('nav.about')}</Link>
        <Link href="/terms">{t('nav.terms')}</Link>
        <Link href="/privacy">{t('nav.privacy')}</Link>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <button 
            onClick={() => setLang('ja')}
            style={{ 
              background: lang === 'ja' ? 'var(--accent-gradient)' : 'transparent',
              color: lang === 'ja' ? 'white' : 'var(--text-secondary)',
              border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
            }}
          >
            JP
          </button>
          <button 
            onClick={() => setLang('en')}
            style={{ 
              background: lang === 'en' ? 'var(--accent-gradient)' : 'transparent',
              color: lang === 'en' ? 'white' : 'var(--text-secondary)',
              border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
            }}
          >
            EN
          </button>
        </div>

        <a href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          {t('nav.add')}
        </a>
      </div>
    </nav>
  );
}
