import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-balance')
    .setDescription('自分の現在のコイン残高を確認します。');

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    const discordId = interaction.user.id;

    if (!guildId) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        // 1. サーバーのカスタムコイン名を取得（未設定ならデフォルトの「GEM」）
        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: guildId },
        });
        const currencyName = guildConfig?.coinName || 'GEM';

        // 2. ユーザーの所持コイン数を取得（未登録なら0枚としてデータを新しく作る）
        const user = await prisma.user.upsert({
            where: {
                guildId_discordId: {
                    guildId: guildId,
                    discordId: discordId,
                }
            },
            update: {}, // 何もしない（ただ取得する）
            create: {
                guildId: guildId,
                discordId: discordId,
                points: 0, // 最初は0枚からスタート
            },
        });

        // 3. スタイリッシュに結果を返す
        await interaction.editReply({
            content: `💰 **${interaction.user.username}** さんの残高\n保有： **${user.points} ${currencyName}** 💎`,
        });
    } catch (error) {
        console.error('Balance error:', error);
        await interaction.editReply({ content: '❌ データの取得中にエラーが発生しました。' });
    }
}