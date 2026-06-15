"use client";

import { useLanguage } from '../../context/LanguageContext';

export default function Campaign() {
  const { t } = useLanguage();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fffbeb', // Light yellow background
      color: '#333',
      fontFamily: '"Zen Maru Gothic", "M PLUS Rounded 1c", "Noto Sans JP", sans-serif', // Rounded font vibe
      padding: '2rem 1rem',
      backgroundImage: 'radial-gradient(#fde68a 2px, transparent 2px)',
      backgroundSize: '20px 20px',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        border: '6px solid #1e3a8a', // Bold blue border
        boxShadow: '8px 8px 0px #1e3a8a', // Solid shadow
        overflow: 'hidden',
      }}>
        
        {/* HERO SECTION */}
        <div style={{
          backgroundColor: '#ef4444', // Red
          padding: '3rem 1rem',
          textAlign: 'center',
          color: '#ffffff',
          position: 'relative',
          borderBottom: '6px solid #1e3a8a',
        }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#fde047', // Yellow badge
            color: '#ef4444',
            fontWeight: '900',
            padding: '0.5rem 1.5rem',
            borderRadius: '50px',
            border: '3px solid #1e3a8a',
            fontSize: '1.2rem',
            marginBottom: '1rem',
            transform: 'rotate(-2deg)',
            boxShadow: '3px 3px 0px #1e3a8a',
          }}>
            {t('campaign.hero.badge')}
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: '900',
            lineHeight: '1.2',
            textShadow: '3px 3px 0px #1e3a8a',
            margin: '0',
          }}>
            {t('campaign.hero.title1')}<br/>
            <span style={{ color: '#fde047', fontSize: '110%' }}>{t('campaign.hero.title2')}</span>
          </h1>
          
          <p style={{
            marginTop: '1.5rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.2)',
            display: 'inline-block',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
          }}>
            {t('campaign.hero.subtitle')}
          </p>
        </div>

        {/* CONTENT SECTION */}
        <div style={{ padding: '2rem' }}>
          
          {/* BENEFITS */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '900',
              color: '#1e3a8a',
              borderBottom: '4px dashed #3b82f6',
              paddingBottom: '0.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {t('campaign.benefits.title')}
            </h2>
            <div style={{
              backgroundColor: '#fef9c3',
              border: '3px solid #eab308',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#b45309' }}>
                {t('campaign.benefits.b1')}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc2626' }}>
                {t('campaign.benefits.b2')}
              </div>
            </div>
          </div>

          {/* CONDITIONS */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '900',
              color: '#1e3a8a',
              borderBottom: '4px dashed #3b82f6',
              paddingBottom: '0.5rem',
              marginBottom: '1.5rem',
            }}>
              {t('campaign.conditions.title')}
            </h2>
            <p style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              lineHeight: '1.8',
              color: '#334155'
            }}>
              {t('campaign.conditions.desc')}
            </p>
          </div>

          {/* SUPPORT */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: '900',
              color: '#1e3a8a',
              marginBottom: '1rem',
            }}>
              {t('campaign.support.title')}
            </h2>
            <div style={{
              display: 'grid',
              gap: '1rem',
            }}>
              <div style={{
                background: '#dbeafe',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                padding: '1rem',
                fontWeight: 'bold',
                color: '#1e3a8a'
              }}>
                {t('campaign.support.free')}
              </div>
              <div style={{
                background: '#ffedd5',
                border: '2px solid #f97316',
                borderRadius: '12px',
                padding: '1rem',
                fontWeight: 'bold',
                color: '#9a3412'
              }}>
                {t('campaign.support.paid')}
              </div>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>
              {t('campaign.support.note')}
            </p>
          </div>

        </div>

        {/* CTA */}
        <div style={{
          backgroundColor: '#f1f5f9',
          padding: '2rem',
          textAlign: 'center',
          borderTop: '6px solid #1e3a8a',
        }}>
          <a href="https://discord.gg/your_discord_link" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block',
            backgroundColor: '#22c55e',
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: '900',
            padding: '1rem 3rem',
            borderRadius: '50px',
            textDecoration: 'none',
            border: '4px solid #14532d',
            boxShadow: '0 6px 0px #14532d',
            transition: 'transform 0.1s, box-shadow 0.1s',
            cursor: 'pointer',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(4px)';
            e.currentTarget.style.boxShadow = '0 2px 0px #14532d';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 0px #14532d';
          }}>
            {t('campaign.cta')}
          </a>
        </div>
      </div>
    </div>
  );
}
