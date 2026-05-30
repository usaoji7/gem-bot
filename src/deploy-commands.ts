import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { data as setupData } from './commands/setup.js';
import { data as balanceData } from './commands/balance.js';
import { data as giveData } from './commands/give.js';
import { data as takeData } from './commands/take.js';
import { data as giveRoleData } from './commands/give-role.js';
import * as storeAdminData from './commands/store-admin.js';
import * as storeData from './commands/store.js';
import * as buyData from './commands/buy.js';
import * as bonusSetupData from './commands/bonus-setup.js';
import * as ticketSetupData from './commands/ticket-setup.js';

// 登録するコマンドのデータを配列にまとめる
const commands = [
    setupData.toJSON(),
    balanceData.toJSON(),
    giveData.toJSON(),
    takeData.toJSON(),
    giveRoleData.toJSON(),
    storeAdminData.data.toJSON(),
    storeData.data.toJSON(),
    buyData.data.toJSON(),
    bonusSetupData.data.toJSON(),
    ticketSetupData.data.toJSON(),
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