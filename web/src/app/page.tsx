"use client";

import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();

  return (
    <>
      <section className="hero">
        <h1 className="hero-title">{t('hero.title1')}<br />{t('hero.title2')}</h1>
        <p className="hero-subtitle">
          {t('hero.subtitle')}
        </p>
        <div className="hero-actions">
          <a href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            {t('hero.invite')}
          </a>
          <Link href="#features" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            {t('hero.explore')}
          </Link>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="features" style={{ background: 'rgba(30, 41, 59, 0.4)', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>{t('step.mainTitle')}</h2>
        <div className="feature-grid" style={{ marginTop: '3rem' }}>
          <div className="feature-card step-card">
            <span className="step-tag">{t('step1.tag')}</span>
            <h3>{t('step1.title')}</h3>
            <p>{t('step1.desc')}</p>
          </div>
          <div className="feature-card step-card">
            <span className="step-tag">{t('step2.tag')}</span>
            <h3>{t('step2.title')}</h3>
            <p>{t('step2.desc')}</p>
          </div>
          <div className="feature-card step-card" style={{ borderColor: 'var(--accent-primary)' }}>
            <span className="step-tag" style={{ background: 'var(--accent-gradient)' }}>{t('step3.tag')}</span>
            <h3>{t('step3.title')}</h3>
            <p>{t('step3.desc')}</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="features">
        <h2 className="section-title">{t('pricing.title')}</h2>
        <div className="pricing-table-wrapper">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>機能 / 特典</th>
                <th className="free-col">{t('pricing.free')}<br/><span className="price">{t('pricing.price.free')}</span></th>
                <th className="prem-col">{t('pricing.premium')}<br/><span className="price">{t('pricing.price.premium')}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr><td>{t('pricing.row1.name')}</td><td>{t('pricing.row1.free')}</td><td className="highlight">{t('pricing.row1.prem')}</td></tr>
              <tr><td>{t('pricing.row2.name')}</td><td>{t('pricing.row2.free')}</td><td>{t('pricing.row2.prem')}</td></tr>
              <tr><td>{t('pricing.row3.name')}</td><td>{t('pricing.row3.free')}</td><td>{t('pricing.row3.prem')}</td></tr>
              <tr><td>{t('pricing.row4.name')}</td><td>{t('pricing.row4.free')}</td><td>{t('pricing.row4.prem')}</td></tr>
              <tr><td>{t('pricing.row5.name')}</td><td>{t('pricing.row5.free')}</td><td>{t('pricing.row5.prem')}</td></tr>
              <tr><td>{t('pricing.row6.name')}</td><td className="disabled">{t('pricing.row6.free')}</td><td className="highlight">{t('pricing.row6.prem')}</td></tr>
              <tr><td>{t('pricing.row7.name')}</td><td>{t('pricing.row7.free')}</td><td>{t('pricing.row7.prem')}</td></tr>
              <tr><td>{t('pricing.row8.name')}</td><td>{t('pricing.row8.free')}</td><td className="highlight">{t('pricing.row8.prem')}</td></tr>
              <tr><td>{t('pricing.row9.name')}</td><td className="disabled">{t('pricing.row9.free')}</td><td className="highlight">{t('pricing.row9.prem')}</td></tr>
              <tr><td>{t('pricing.row10.name')}</td><td className="disabled">{t('pricing.row10.free')}</td><td className="highlight">{t('pricing.row10.prem')}</td></tr>
              <tr><td>{t('pricing.row11.name')}</td><td className="disabled">{t('pricing.row11.free')}</td><td className="highlight">{t('pricing.row11.prem')}</td></tr>
              <tr><td>{t('pricing.row12.name')}</td><td className="disabled">{t('pricing.row12.free')}</td><td className="highlight">{t('pricing.row12.prem')}</td></tr>
              <tr><td>{t('pricing.row13.name')}</td><td className="disabled">{t('pricing.row13.free')}</td><td className="highlight">{t('pricing.row13.prem')}</td></tr>
              <tr><td>{t('pricing.row14.name')}</td><td className="disabled">{t('pricing.row14.free')}</td><td className="highlight">{t('pricing.row14.prem')}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature Details Section */}
      <section id="features" className="features" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
        <h2 className="section-title">{t('features.title')}</h2>
        <div className="feature-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
          
          <div className="feature-card">
            <h3>{t('feat.eco.title')}</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{t('feat.eco.desc1')}</p>
            <p>{t('feat.eco.desc2')}</p>
          </div>
          
          <div className="feature-card">
            <h3>{t('feat.panel.title')}</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{t('feat.panel.desc1')}</p>
            <p>{t('feat.panel.desc2')}</p>
          </div>
          
          <div className="feature-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <h3>{t('feat.season.title')}</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{t('feat.season.desc1')}</p>
            <p>{t('feat.season.desc2')}</p>
          </div>
          
          <div className="feature-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <h3>{t('feat.ref.title')}</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{t('feat.ref.desc1')}</p>
            <p>{t('feat.ref.desc2')}</p>
          </div>
          
        </div>
      </section>
    </>
  );
}
