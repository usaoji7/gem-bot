import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-setup') // ⚠️ Discordの制限でスラッシュコマンド名にスペースは使えないため、一旦ハイフンで繋ぎます
    .setDescription('【管理者専用】サーバー独自のオリジナルコインを命名・作成します。')
    .addStringOption(option =>
        option
            .setName('name')
            .setDescription('創り出すオリジナルコインの名前（ex:GuildCoin 、サウナポイント）')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator); // 管理者だけが使えるように制限

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', ephemeral: true });
        return;
    }

    // ユーザーが入力したコインの名前を取得
    const coinName = interaction.options.getString('name', true);

    await interaction.deferReply({ ephemeral: true });

    try {
        // MySQLにデータを保存（すでに設定があれば更新、なければ新規作成）
        const config = await prisma.guildConfig.upsert({
            where: { guildId: guildId },
            update: { coinName: coinName },
            create: {
                guildId: guildId,
                coinName: coinName,
            },
        });

        await interaction.editReply({
            content: `💎 **ギルド経済造幣局（GEM）へようこそ！**\nこのサーバーの独自通貨が **「${config.coinName}」** に命名・鋳造されました！`,
        });
    } catch (error) {
        console.error('Setup error:', error);
        await interaction.editReply({ content: '❌ データベースの保存中にエラーが発生しました。' });
    }
}