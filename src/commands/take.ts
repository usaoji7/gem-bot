import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-take')
    .setDescription('【管理者専用】指定したユーザーからコインを剥奪します。')
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('剥奪する対象のユーザー')
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option
            .setName('amount')
            .setDescription('剥奪するコインの量')
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
    
    await interaction.deferReply({ ephemeral: true });

    try {
        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: guildId },
        });
        const currencyName = guildConfig?.coinName || 'GEM';

        // まず現在のユーザーの残高を確認する
        const currentUser = await prisma.user.findUnique({
            where: {
                guildId_discordId: {
                    guildId: guildId,
                    discordId: targetUser.id,
                }
            }
        });

        if (!currentUser || currentUser.points < amount) {
            await interaction.editReply({ 
                content: `❌ **${targetUser.username}** さんの残高が不足しています。(現在: **${currentUser?.points || 0} ${currencyName}**)`
            });
            return;
        }

        // 残高を更新する
        const updatedUser = await prisma.user.update({
            where: {
                guildId_discordId: {
                    guildId: guildId,
                    discordId: targetUser.id,
                }
            },
            data: {
                points: {
                    decrement: amount,
                },
            },
        });

        await interaction.editReply({
            content: `✅ **${targetUser.username}** さんから **${amount} ${currencyName}** を剥奪しました。\n現在の残高: **${updatedUser.points} ${currencyName}**`,
        });
    } catch (error) {
        console.error('Take command error:', error);
        await interaction.editReply({ content: '❌ 通貨の剥奪中にエラーが発生しました。' });
    }
}
