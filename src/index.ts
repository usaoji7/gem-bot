import { Client, GatewayIntentBits, ActivityType, type Interaction } from 'discord.js';
import 'dotenv/config';
import * as setupCommand from './commands/setup.js';
import * as balanceCommand from './commands/balance.js';
import * as giveCommand from './commands/give.js';
import * as takeCommand from './commands/take.js';
import * as giveRoleCommand from './commands/give-role.js';
import * as storeAdminCommand from './commands/store-admin.js';
import * as storeCommand from './commands/store.js';
import * as buyCommand from './commands/buy.js';
import * as bonusSetupCommand from './commands/bonus-setup.js';
import * as ticketSetupCommand from './commands/ticket-setup.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`──────────────────────────────────────────`);
    console.log(` 💎 GEM Bot (Guild Economy Mint) 起動成功！`);
    console.log(` 🤖 ログイン名: ${client.user?.tag}`);
    console.log(` 📅 起動時刻: ${new Date().toLocaleString()}`);
    console.log(`──────────────────────────────────────────`);

    client.user?.setActivity({
        name: 'Guild Economy /gem',
        type: ActivityType.Watching,
    });
});

import { handleBonusButton } from './events/bonusButton.js';
import { handleTicketButton } from './events/ticketButton.js';

// 💡 Discordで誰かがコマンドを打ったときに動くイベント処理
client.on('interactionCreate', async (interaction: Interaction) => {
    // ボタンが押された場合の処理
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('bonus_')) {
            await handleBonusButton(interaction);
        } else if (interaction.customId.startsWith('ticket_')) {
            await handleTicketButton(interaction);
        }
        return;
    }

    // チャット入力形式のコマンド（スラッシュコマンド）以外は無視
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        // 叩かれたコマンド名に応じて、それぞれのファイルの execute 関数を実行
        if (commandName === 'gem-setup') {
            await setupCommand.execute(interaction);
        } else if (commandName === 'gem-balance') {
            await balanceCommand.execute(interaction);
        } else if (commandName === 'gem-give') {
            await giveCommand.execute(interaction);
        } else if (commandName === 'gem-take') {
            await takeCommand.execute(interaction);
        } else if (commandName === 'gem-give-role') {
            await giveRoleCommand.execute(interaction);
        } else if (commandName === 'gem-store') {
            await storeAdminCommand.execute(interaction);
        } else if (commandName === 'store') {
            await storeCommand.execute(interaction);
        } else if (commandName === 'buy') {
            await buyCommand.execute(interaction);
        } else if (commandName === 'gem-bonus-setup') {
            await bonusSetupCommand.execute(interaction);
        } else if (commandName === 'gem-ticket-setup') {
            await ticketSetupCommand.execute(interaction);
        }
    } catch (error) {
        console.error(`コマンド実行エラー (${commandName}):`, error);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: '❌ コマンドの実行中に内部エラーが発生しました。' });
        } else {
            await interaction.reply({ content: '❌ コマンドの実行中に内部エラーが発生しました。', ephemeral: true });
        }
    }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ .env に DISCORD_TOKEN が設定されていません。');
    process.exit(1);
}

client.login(token);