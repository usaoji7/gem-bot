import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { prisma } from '../prisma.js';
import { LEVEL_CONSTANTS } from '../constants/level.js';

export const data = new SlashCommandBuilder()
    .setName('gem-season')
    .setDescription('【管理者専用】シーズン管理を行います。')
    .addSubcommand(subcommand =>
        subcommand
            .setName('start')
            .setDescription('新しいシーズン（3ヶ月間）を手動で開始し、全メンバーの当シーズンの獲得EXP・GEMレベルをリセットします。')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId || !interaction.guild) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', flags: MessageFlags.Ephemeral });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {
        if (subcommand === 'start') {
            const currentSeason = await prisma.guildSeason.findFirst({
                where: { guildId, isActive: true },
                orderBy: { seasonNumber: 'desc' }
            });

            let nextSeasonNumber = 1;
            if (currentSeason) {
                nextSeasonNumber = currentSeason.seasonNumber + 1;
                await prisma.guildSeason.update({
                    where: { id: currentSeason.id },
                    data: { isActive: false, endedAt: new Date() }
                });
            }

            const now = new Date();
            const endDate = new Date(now);
            endDate.setMonth(endDate.getMonth() + LEVEL_CONSTANTS.SEASON.DURATION_MONTHS);

            await prisma.guildSeason.create({
                data: {
                    guildId,
                    seasonNumber: nextSeasonNumber,
                    startedAt: now,
                    endedAt: endDate,
                    isActive: true
                }
            });

            await prisma.user.updateMany({
                where: { guildId },
                data: {
                    currentSeasonExp: 0,
                    level: 1
                }
            });

            await interaction.editReply({
                content: `🎉 **シーズン ${nextSeasonNumber} が開幕しました！**\n今シーズンの終了予定: <t:${Math.floor(endDate.getTime() / 1000)}:f>\n全メンバーの当シーズン獲得EXPとGEMレベルがリセットされました。`
            });
        }
    } catch (error) {
        console.error('Season command error:', error);
        await interaction.editReply({ content: '❌ コマンドの実行中にエラーが発生しました。' });
    }
}
