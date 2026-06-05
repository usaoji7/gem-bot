import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('gem-invite')
    .setDescription('自分専用のリファラル用（友達招待）Discordリンクを動的に発行します。');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const invite = await interaction.guild.invites.create(interaction.channel.id, {
            maxAge: 0, // 無期限
            maxUses: 0, // 無制限
            unique: true, // 必ずユニークなURLを発行
            reason: `gem-invite by ${interaction.user.tag}`
        });

        await interaction.editReply({
            content: `🤝 **あなた専用の友達招待リンクを発行しました！**\n\nこのリンクから友達がサーバーに参加し、一定回数ログインすると、あなたと友達の双方に **GEM** と **パッシブEXP還元（30日間）** が付与されます！\n\n🔗 招待リンク: ${invite.url}`
        });
    } catch (error) {
        console.error('Invite command error:', error);
        await interaction.editReply({ content: '❌ 招待リンクの発行中にエラーが発生しました。ボットに「招待を作成」権限があるか確認してください。' });
    }
}
