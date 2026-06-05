import { Client, GatewayIntentBits, ActivityType, Events, MessageFlags, Collection, Invite, type Interaction } from 'discord.js';
import { prisma } from './prisma.js';
import 'dotenv/config';

import * as setupCommand from './commands/setup.js';
import * as balanceCommand from './commands/balance.js';
import * as storeAdminCommand from './commands/store-admin.js';
import * as storeCommand from './commands/store.js';
import * as buyCommand from './commands/buy.js';
import * as statusOpenCommand from './commands/status-open.js';

import * as managementCommand from './commands/management.js';
import * as panelCommand from './commands/panel.js';
import * as configCommand from './commands/config.js';
import * as streakCommand from './commands/streak.js';
import * as seasonCommand from './commands/season.js';
import * as inviteCommand from './commands/invite.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
    ],
});

const invitesCache = new Map<string, Collection<string, Invite>>();

client.once(Events.ClientReady, async () => {
    console.log(`──────────────────────────────────────────`);
    console.log(` 💎 GEM Bot (Guild Economy Mint) 起動成功！`);
    console.log(` 🤖 ログイン名: ${client.user?.tag}`);
    console.log(` 📅 起動時刻: ${new Date().toLocaleString()}`);
    console.log(`──────────────────────────────────────────`);

    client.user?.setActivity({
        name: 'Guild Economy /gem',
        type: ActivityType.Watching,
    });

    for (const guild of client.guilds.cache.values()) {
        try {
            const invites = await guild.invites.fetch();
            invitesCache.set(guild.id, invites);
        } catch (err) {
            console.error(`Failed to fetch invites for guild ${guild.id}`, err);
        }
    }

    // スパム対策ログの定期削除（1時間ごとに、24時間以上古いログを消去）
    setInterval(async () => {
        try {
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);
            const deleted = await prisma.actionLog.deleteMany({
                where: { createdAt: { lt: yesterday } }
            });
            if (deleted.count > 0) {
                console.log(`[Cron] ${deleted.count}件の古いアクションログを削除しました。`);
            }
        } catch (error) {
            console.error('[Cron] ログ削除中にエラーが発生しました:', error);
        }
    }, 60 * 60 * 1000); // 1時間ごと
});

client.on(Events.InviteCreate, (invite) => {
    if (invite.guild) {
        const guildInvites = invitesCache.get(invite.guild.id) || new Collection<string, Invite>();
        guildInvites.set(invite.code, invite);
        invitesCache.set(invite.guild.id, guildInvites);
    }
});

client.on(Events.InviteDelete, (invite) => {
    if (invite.guild) {
        const guildInvites = invitesCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.delete(invite.code);
        }
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    const guild = member.guild;
    const cachedInvites = invitesCache.get(guild.id) || new Collection<string, Invite>();

    try {
        const newInvites = await guild.invites.fetch();
        const usedInvite = newInvites.find(inv => {
            const cachedInv = cachedInvites.get(inv.code);
            if (!cachedInv) return false;
            return inv.uses !== null && cachedInv.uses !== null && inv.uses > cachedInv.uses;
        });

        invitesCache.set(guild.id, newInvites);

        if (usedInvite) {
            let inviterId = usedInvite.inviterId;
            
            const botInvite = await prisma.botInvite.findUnique({
                where: { code: usedInvite.code }
            });
            if (botInvite) {
                inviterId = botInvite.discordId;
            }

            if (inviterId) {
                const now = new Date();
            const createdAt = member.user.createdAt;
            const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceCreation < 7) {
                const guildConfig = await prisma.guildConfig.findUnique({ where: { guildId: guild.id } });
                if (guildConfig?.logChannelId) {
                    const logChannel = guild.channels.cache.get(guildConfig.logChannelId);
                    if (logChannel && 'send' in logChannel) {
                        await logChannel.send(`⚠️ **[不正検知警告]** 作成から7日以内のアカウントが招待されました。\n招待されたユーザー: <@${member.id}> (ID: ${member.id})\n招待したユーザー: <@${inviterId}>`);
                    }
                }
            }

            await prisma.referral.upsert({
                where: { guildId_childId: { guildId: guild.id, childId: member.id } },
                update: {}, 
                create: {
                    guildId: guild.id,
                    parentId: inviterId,
                    childId: member.id,
                    inviteCode: usedInvite.code,
                }
            });
            console.log(`[Referral] ${member.user.tag} joined via ${usedInvite.code} (inviter: ${inviterId})`);
            }
        }
    } catch (err) {
        console.error('guildMemberAdd invite fetch error', err);
    }
});

import { handleBonusButton } from './events/bonusButton.js';
import { handleTicketButton } from './events/ticketButton.js';
import { addExp } from './services/level.js';
import { LEVEL_CONSTANTS } from './constants/level.js';

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.member) return;

    if (message.content.length < LEVEL_CONSTANTS.LIMITS.TEXT_MIN_LENGTH || message.content.length > LEVEL_CONSTANTS.LIMITS.TEXT_MAX_LENGTH) {
        return;
    }

    try {
        const result = await addExp(message.member, 'TEXT');
        if (result.levelUp && 'send' in message.channel) {
            await message.channel.send(`🎉 ${message.author} レベルアップ！ 現在のGEMレベル: **Lv.${result.newLevel}**`);
        }
    } catch (error) {
        console.error('EXP追加エラー(TEXT):', error);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot || !reaction.message.guild) return;

    if (reaction.message.author?.id === user.id) return;

    try {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (!member) return;
        const result = await addExp(member, 'REACTION', reaction.message.id);
        if (result.levelUp && 'send' in reaction.message.channel) {
            await reaction.message.channel.send(`🎉 ${user} レベルアップ！ 現在のGEMレベル: **Lv.${result.newLevel}**`);
        }
    } catch (error) {
        console.error('EXP追加エラー(REACTION):', error);
    }
});

client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'invite_generate') {
            if (!interaction.guild || !interaction.channel) return;
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            try {
                const invite = await interaction.guild.invites.create(interaction.channel.id, {
                    maxAge: 0,
                    maxUses: 0,
                    unique: true,
                    reason: `gem-invite by ${interaction.user.tag}`
                });

                await prisma.botInvite.create({
                    data: {
                        code: invite.code,
                        guildId: interaction.guild.id,
                        discordId: interaction.user.id
                    }
                });

                await interaction.editReply({
                    content: `🤝 **あなた専用の友達招待リンクを発行しました！**\n🔗 招待リンク: ${invite.url}`
                });
            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ 招待リンクの発行中にエラーが発生しました。ボットに権限があるか確認してください。' });
            }
            return;
        } else if (interaction.customId.startsWith('bonus_')) {
            await handleBonusButton(interaction);
        } else if (interaction.customId.startsWith('ticket_')) {
            await handleTicketButton(interaction);
        }
        return;
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'streak_delete_select') {
            await streakCommand.handleStreakSelect(interaction);
        } else if (interaction.customId === 'streak_role_delete_select') {
            await streakCommand.handleStreakRoleSelect(interaction);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        if (commandName === 'gem-setup') {
            await setupCommand.execute(interaction);
        } else if (commandName === 'gem-balance') {
            await balanceCommand.execute(interaction);
        } else if (commandName === 'gem-store') {
            await storeAdminCommand.execute(interaction);
        } else if (commandName === 'store') {
            await storeCommand.execute(interaction);
        } else if (commandName === 'buy') {
            await buyCommand.execute(interaction);
        } else if (commandName === 'gem-status-open') {
            await statusOpenCommand.execute(interaction);
        } else if (commandName === 'gem-management') {
            await managementCommand.execute(interaction);
        } else if (commandName === 'gem-panel') {
            await panelCommand.execute(interaction);
        } else if (commandName === 'gem-config') {
            await configCommand.execute(interaction);
        } else if (commandName === 'gem-streak') {
            await streakCommand.execute(interaction);
        } else if (commandName === 'gem-season') {
            await seasonCommand.execute(interaction);
        } else if (commandName === 'gem-invite') {
            await inviteCommand.execute(interaction);
        }
    } catch (error) {
        console.error(`コマンド実行エラー (${commandName}):`, error);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: '❌ コマンドの実行中に内部エラーが発生しました。' });
        } else {
            await interaction.reply({ content: '❌ コマンドの実行中に内部エラーが発生しました。', flags: MessageFlags.Ephemeral });
        }
    }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ .env に DISCORD_TOKEN が設定されていません。');
    process.exit(1);
}

client.login(token);