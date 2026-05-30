import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-give-role')
    .setDescription('【管理者専用】特定のロールを持つメンバー全員にコインを付与します。')
    .addRoleOption(option =>
        option
            .setName('role')
            .setDescription('付与する対象のロール')
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

    const targetRole = interaction.options.getRole('role', true);
    const amount = interaction.options.getInteger('amount', true);
    
    await interaction.deferReply({ ephemeral: true });

    try {
        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: guildId },
        });
        const currencyName = guildConfig?.coinName || 'GEM';

        // サーバーの全メンバーを取得（キャッシュにない可能性があるのでfetchする）
        if (!interaction.guild) {
            throw new Error('Guild not found');
        }
        const members = await interaction.guild.members.fetch();
        
        // 対象のロールを持つメンバーをフィルタリング
        const targetMembers = members.filter(member => member.roles.cache.has(targetRole.id));
        
        if (targetMembers.size === 0) {
            await interaction.editReply({ content: `⚠️ そのロールを持つメンバーがいません。` });
            return;
        }

        // バルクアップサート的なことはPrismaでは複雑なので、ループで処理する
        // ※対象者が多すぎると時間がかかるのでトランザクションか Promise.all を使用
        const updatePromises = targetMembers.map(member => {
            return prisma.user.upsert({
                where: {
                    guildId_discordId: {
                        guildId: guildId,
                        discordId: member.id,
                    }
                },
                update: {
                    points: {
                        increment: amount,
                    },
                },
                create: {
                    guildId: guildId,
                    discordId: member.id,
                    points: amount,
                },
            });
        });

        await Promise.all(updatePromises);

        await interaction.editReply({
            content: `✅ **${targetRole.name}** ロールを持つ **${targetMembers.size}名** に **${amount} ${currencyName}** を一斉付与しました！`,
        });
    } catch (error) {
        console.error('Give-role command error:', error);
        await interaction.editReply({ content: '❌ 通貨の一斉付与中にエラーが発生しました。' });
    }
}
