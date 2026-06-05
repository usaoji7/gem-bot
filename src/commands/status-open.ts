import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { prisma } from '../prisma.js';
import { getLevelInfo } from '../constants/level.js';
import { calculateMultiplier } from '../services/level.js';

export const data = new SlashCommandBuilder()
    .setName('gem-status-open')
    .setDescription('自分の現在のGEMレベル、適用中のEXPバフ、シーズン進捗を確認します。');

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    const discordId = interaction.user.id;

    if (!guildId || !interaction.member) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const user = await prisma.user.findUnique({
            where: { guildId_discordId: { guildId, discordId } }
        });

        if (!user) {
            await interaction.editReply({ content: '📉 まだデータがありません。チャットやログインボーナスでEXPを稼ぎましょう！' });
            return;
        }

        const currentLevelInfo = getLevelInfo(user.totalExp);
        
        // 適用中のバフ倍率を取得
        // @ts-ignore
        const multiplier = await calculateMultiplier(interaction.member);

        const embed = new EmbedBuilder()
            .setTitle(`📊 ${interaction.user.username} のステータス`)
            .setColor(0x00FF00)
            .addFields(
                { name: '👑 GEMレベル', value: `**Lv.${user.level}**`, inline: true },
                { name: '⭐ 獲得GEM倍率', value: `**${currentLevelInfo.gemMultiplier}倍**`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true }, // 空のフィールドでレイアウト調整
                { name: '📈 当シーズン獲得EXP', value: `**${user.currentSeasonExp}** EXP`, inline: true },
                { name: '🌟 通算EXP', value: `**${user.totalExp}** EXP`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '🔥 現在のEXP獲得倍率（バフ）', value: `**${multiplier}倍**`, inline: false },
                { name: '🔥 連続ログイン日数', value: `**${user.streakCount}日**`, inline: false }
            )
            .setThumbnail(interaction.user.displayAvatarURL());

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Status open error:', error);
        await interaction.editReply({ content: '❌ ステータスの取得中にエラーが発生しました。' });
    }
}
