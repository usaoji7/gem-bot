"use client";

import { useLanguage } from '../../context/LanguageContext';

export default function Commands() {
  const { t } = useLanguage();

  return (
    <div className="doc-container" style={{ maxWidth: '1000px' }}>
      <h1 className="doc-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>{t('commands.title')}</h1>

      <div className="doc-section">
        <h2 style={{ color: 'var(--accent-primary)', borderBottom: '2px solid var(--accent-primary)' }}>{t('commands.admin.title')}</h2>
        <p style={{ marginBottom: '1.5rem' }}>{t('commands.admin.desc')}</p>
        
        <div className="pricing-table-wrapper" style={{ marginTop: '0' }}>
          <table className="pricing-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Command</th>
                <th style={{ width: '25%' }}>Subcommand</th>
                <th style={{ width: '50%', textAlign: 'left' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-setup</code></td>
                <td style={{ textAlign: 'left' }}>-</td>
                <td style={{ textAlign: 'left' }}>サーバー独自のオリジナル通貨の名前（単位）を設定します。（初回必須）</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-management</code></td>
                <td style={{ textAlign: 'left' }}><code>give</code><br/><code>give-role</code></td>
                <td style={{ textAlign: 'left' }}>指定ユーザーにポイントを付与（マイナスで剥奪）。<br/>指定ロールを持つメンバー全員に一斉付与。</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-store</code></td>
                <td style={{ textAlign: 'left' }}><code>add</code><br/><code>remove</code></td>
                <td style={{ textAlign: 'left' }}>ストアに新しい商品を登録します。ロール指定で自動付与。<br/>ストアから指定IDの商品を削除します。</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-panel</code></td>
                <td style={{ textAlign: 'left' }}><code>bonus</code><br/><code>ticket</code><br/><code>invite</code></td>
                <td style={{ textAlign: 'left' }}>ログインボーナス / 他人向けルーレットパネルを設置。<br/>プライベートチケットパネルを設置。<br/>リファラル案内パネルを設置。</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-config</code></td>
                <td style={{ textAlign: 'left' }}><code>level</code><br/><code>referral</code><br/><code>log</code></td>
                <td style={{ textAlign: 'left' }}>1日のEXP獲得上限を設定。<br/>リファラルの達成条件とパッシブ還元設定。<br/>ログ通知チャンネルの設定。</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-streak</code></td>
                <td style={{ textAlign: 'left' }}><code>setup</code><br/><code>manage</code><br/><code>role-add</code><br/><code>role-manage</code></td>
                <td style={{ textAlign: 'left' }}>連続ログイン日数による報酬（バフ等）の設定と管理。<br/>特権ロールのバフ設定と管理。</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-season</code></td>
                <td style={{ textAlign: 'left' }}><code>start</code></td>
                <td style={{ textAlign: 'left' }}>新シーズンを手動で開始し、全メンバーの当シーズンEXP・レベルをリセット。</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="doc-section" style={{ marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--accent-secondary)', borderBottom: '2px solid var(--accent-secondary)' }}>{t('commands.user.title')}</h2>
        <p style={{ marginBottom: '1.5rem' }}>{t('commands.user.desc')}</p>
        
        <div className="pricing-table-wrapper" style={{ marginTop: '0' }}>
          <table className="pricing-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Command</th>
                <th style={{ width: '70%', textAlign: 'left' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-status-open</code></td>
                <td style={{ textAlign: 'left' }}>自分の現在のGEMレベル、適用中のEXPバフ、現在の合計ブースト、シーズン進捗、所持残高を確認します。</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-balance</code></td>
                <td style={{ textAlign: 'left' }}>自分の現在のポイント残高を確認します。</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/store</code></td>
                <td style={{ textAlign: 'left' }}>現在ストアで販売されている商品と価格の一覧を表示します。</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/buy</code></td>
                <td style={{ textAlign: 'left' }}>ポイントを消費してストアの商品を購入し、紐づいたロールを自動取得します。</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}><code>/gem-invite</code></td>
                <td style={{ textAlign: 'left' }}>自分専用のリファラル用（友達招待）Discordリンクを動的に発行します。</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
