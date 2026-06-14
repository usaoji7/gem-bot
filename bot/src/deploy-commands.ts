import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { data as setupData } from './commands/setup.js';
import { data as balanceData } from './commands/balance.js';
import { data as buyData } from './commands/buy.js';
import { data as storeData } from './commands/store.js';
import { data as storeAdminData } from './commands/store-admin.js';
import { data as statusOpenData } from './commands/status-open.js';

// 新しいグループ化されたコマンド
import { data as managementData } from './commands/management.js';
import { data as panelData } from './commands/panel.js';
import { data as configData } from './commands/config.js';
import { data as streakData } from './commands/streak.js';
import * as seasonData from './commands/season.js';
import { data as inviteData } from './commands/invite.js';
import { data as backupData } from './commands/backup.js';

// 登録するコマンドのデータを配列にまとめる
const commands = [
    setupData.toJSON(),
    balanceData.toJSON(),
    buyData.toJSON(),
    storeData.toJSON(),
    storeAdminData.toJSON(),
    statusOpenData.toJSON(),
    managementData.toJSON(),
    panelData.toJSON(),
    configData.toJSON(),
    streakData.toJSON(),
    seasonData.data.toJSON(),
    inviteData.toJSON(),
    backupData.toJSON(),
];

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ DISCORD_TOKEN が設定されていません。');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('🔄 スラッシュコマンドの登録（デプロイ）を開始します...');

        // 💡 Bot自身のユーザーID（クライアントID）をトークンから自動で解析して取得
        const base64GuildId = token.split('.')[0];
        if (!base64GuildId) throw new Error('トークンの形式が不正です。');
        const clientId = Buffer.from(base64GuildId, 'base64').toString('ascii');

        // DiscordのAPIにコマンド一覧を送信して一括登録
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log('✨ スラッシュコマンドのグローバル登録が正常に完了しました！');
        console.log('💡 Discordアプリを再起動するか、少し待つと全サーバーに反映されます。');
    } catch (error) {
        console.error('❌ コマンドの登録中にエラーが発生しました:', error);
    }
})();