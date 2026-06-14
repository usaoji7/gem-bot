import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-management')
    .setDescription('【管理者専用】ポイントの直接付与や剥奪（減算）を行います。')
    .addSubcommand(subcommand =>
        subcommand
            .setName('give')
            .setDescription('指定したユーザーにポイントを付与（またはマイナス値で剥奪）します。')
            .addUserOption(option =>
                option.setName('user').setDescription('対象のユーザー').setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('amount').setDescription('付与する量（マイナスで剥奪）').setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('give-role')
            .setDescription('指定したロールを持つメンバー全員にポイントを一斉付与（または剥奪）します。')
            .addRoleOption(option =>
                option.setName('role').setDescription('対象のロール').setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('amount').setDescription('付与する量（マイナスで剥奪）').setRequired(true)
            )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId || !interaction.guild) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', flags: MessageFlags.Ephemeral });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId },
        });
        const currencyName = guildConfig?.coinName || 'GEM';

        if (subcommand === 'give') {
            const targetUser = interaction.options.getUser('user', true);
            const amount = interaction.options.getInteger('amount', true);

            const userRecord = await prisma.user.upsert({
                where: { guildId_discordId: { guildId, discordId: targetUser.id } },
                update: { points: { increment: amount } },
                create: { guildId, discordId: targetUser.id, points: amount },
            });

            const actionWord = amount >= 0 ? '付与' : '剥奪（減算）';
            await interaction.editReply({
                content: `✅ **${targetUser.username}** さんに **${Math.abs(amount)} ${currencyName}** を${actionWord}しました！\n現在の残高: **${userRecord.points} ${currencyName}**`,
            });
        } else if (subcommand === 'give-role') {
            const { isPremiumOrTrial } = await import('../services/subscription.js');
            if (!(await isPremiumOrTrial(guildId))) {
                await interaction.editReply({ content: '🌟 **FREEプランではロール一斉付与機能は利用できません。プレミアムプランへアップグレードしてください！**' });
                return;
            }

            const role = interaction.options.getRole('role', true);
            const amount = interaction.options.getInteger('amount', true);

            await interaction.guild.members.fetch();
            const roleMembers = interaction.guild.roles.cache.get(role.id)?.members;

            if (!roleMembers || roleMembers.size === 0) {
                await interaction.editReply({ content: `⚠️ 指定されたロール（<@&${role.id}>）を持つメンバーが見つかりませんでした。` });
                return;
            }

            let successCount = 0;
            const updates = [];

            for (const [memberId, member] of roleMembers) {
                if (member.user.bot) continue;

                updates.push(
                    prisma.user.upsert({
                        where: { guildId_discordId: { guildId, discordId: memberId } },
                        update: { points: { increment: amount } },
                        create: { guildId, discordId: memberId, points: Math.max(0, amount) },
                    })
                );
                successCount++;
            }

            if (updates.length > 0) {
                await prisma.$transaction(updates);
            }

            const actionWord = amount >= 0 ? '付与' : '剥奪（減算）';
            await interaction.editReply({
                content: `✅ 対象ロール <@&${role.id}> を持つ **${successCount}人** のメンバーに **${Math.abs(amount)} ${currencyName}** を一斉に${actionWord}しました！`,
            });
        }
    } catch (error) {
        console.error('Management command error:', error);
        await interaction.editReply({ content: '❌ コマンドの実行中にエラーが発生しました。' });
    }
}
