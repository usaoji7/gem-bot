"use client";

import { useLanguage } from '../../context/LanguageContext';

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <div className="doc-container">
      <h1 className="doc-title">{t('privacy.title')}</h1>
      <span className="doc-date">{t('privacy.updated')}</span>

      <div className="doc-section">
        <h2>{t('privacy.sec1.title')}</h2>
        <p>{t('privacy.sec1.desc')}</p>
        <ul>
          <li>{t('privacy.sec1.li1')}</li>
          <li>{t('privacy.sec1.li2')}</li>
          <li>{t('privacy.sec1.li3')}</li>
          <li>{t('privacy.sec1.li4')}</li>
        </ul>
      </div>

      <div className="doc-section">
        <h2>{t('privacy.sec2.title')}</h2>
        <p>{t('privacy.sec2.desc')}</p>
      </div>

      <div className="doc-section">
        <h2>{t('privacy.sec3.title')}</h2>
        <p>{t('privacy.sec3.desc')}</p>
      </div>

      <div className="doc-section">
        <h2>{t('privacy.sec4.title')}</h2>
        <p>{t('privacy.sec4.desc')}</p>
      </div>

      <div className="doc-section">
        <h2>{t('privacy.sec5.title')}</h2>
        <p>{t('privacy.sec5.desc')}</p>
      </div>
    </div>
  );
}
