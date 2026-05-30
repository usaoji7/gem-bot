import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-give')
    .setDescription('【管理者専用】指定したユーザーにコインを付与します。')
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('付与する対象のユーザー')
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option
            .setName('amount')
            .setDescription('付与するコインの量')
            .setRequired(true)
            .setMinValue(1)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', ephemeral: true });
        return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    
    // ユーザー自身には付与できないようにする？（任意。一旦許可する）
    
    await interaction.deferReply({ ephemeral: true });

    try {
        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: guildId },
        });
        const currencyName = guildConfig?.coinName || 'GEM';

        // ユーザーの残高を取得して更新する（未登録の場合は0からスタートして加算）
        const userRecord = await prisma.user.upsert({
            where: {
                guildId_discordId: {
                    guildId: guildId,
                    discordId: targetUser.id,
                }
            },
            update: {
                points: {
                    increment: amount,
                },
            },
            create: {
                guildId: guildId,
                discordId: targetUser.id,
                points: amount,
            },
        });

        await interaction.editReply({
            content: `✅ **${targetUser.username}** さんに **${amount} ${currencyName}** を付与しました！\n現在の残高: **${userRecord.points} ${currencyName}**`,
        });
    } catch (error) {
        console.error('Give command error:', error);
        await interaction.editReply({ content: '❌ 通貨の付与中にエラーが発生しました。' });
    }
}
