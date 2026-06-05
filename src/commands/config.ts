import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-config')
    .setDescription('【管理者専用】サーバーごとの各種基本設定を行います。')
    .addSubcommand(subcommand =>
        subcommand
            .setName('level')
            .setDescription('1日にアクションでEXPを獲得できる上限回数を設定します。')
            .addIntegerOption(option => option.setName('text_limit').setDescription('テキスト投稿の上限（デフォルト: 5回）').setRequired(false).setMinValue(1))
            .addIntegerOption(option => option.setName('reaction_limit').setDescription('リアクションの上限（デフォルト: 5回）').setRequired(false).setMinValue(1))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('referral')
            .setDescription('リファラル（友達招待）成立の条件と報酬設定を行います。')
            .addIntegerOption(option => option.setName('login_count').setDescription('成立に必要な子のログイン回数（例: 3）').setRequired(true).setMinValue(1))
            .addIntegerOption(option => option.setName('bonus_gem').setDescription('成立時の確定ボーナスGEM（双方に付与）').setRequired(true).setMinValue(0))
            .addNumberOption(option => option.setName('passive_rate').setDescription('パッシブ還元率（例: 0.1 で 10%）').setRequired(true).setMinValue(0.01).setMaxValue(1.0))
            .addIntegerOption(option => option.setName('passive_days').setDescription('パッシブ還元期間の日数（例: 30）').setRequired(true).setMinValue(1))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('log')
            .setDescription('システムエラーや不正検知の警告などを受け取るログチャンネルを設定します。')
            .addChannelOption(option => option.setName('channel').setDescription('通知先のチャンネル').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', flags: MessageFlags.Ephemeral });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        if (subcommand === 'level') {
            const textLimit = interaction.options.getInteger('text_limit');
            const reactionLimit = interaction.options.getInteger('reaction_limit');

            if (textLimit === null && reactionLimit === null) {
                return interaction.editReply({ content: '❌ `text_limit` か `reaction_limit` のどちらかは設定してください。' });
            }

            const config = await prisma.guildConfig.upsert({
                where: { guildId },
                update: {
                    ...(textLimit !== null && { textExpLimit: textLimit }),
                    ...(reactionLimit !== null && { reactionExpLimit: reactionLimit })
                },
                create: {
                    guildId,
                    textExpLimit: textLimit ?? 5,
                    reactionExpLimit: reactionLimit ?? 5
                }
            });

            await interaction.editReply({
                content: `✅ レベル上限設定を更新しました！\n💬 テキスト上限: **1日${config.textExpLimit}回**\n👍 リアクション上限: **1日${config.reactionExpLimit}回**`
            });
        } else if (subcommand === 'referral') {
            const loginCount = interaction.options.getInteger('login_count', true);
            const bonusGem = interaction.options.getInteger('bonus_gem', true);
            const passiveRate = interaction.options.getNumber('passive_rate', true);
            const passiveDays = interaction.options.getInteger('passive_days', true);

            const config = await prisma.guildConfig.upsert({
                where: { guildId },
                update: {
                    referralLoginCount: loginCount,
                    referralBonusGem: bonusGem,
                    referralPassiveRate: passiveRate,
                    referralPassiveDays: passiveDays
                },
                create: {
                    guildId,
                    referralLoginCount: loginCount,
                    referralBonusGem: bonusGem,
                    referralPassiveRate: passiveRate,
                    referralPassiveDays: passiveDays
                }
            });

            await interaction.editReply({
                content: `✅ リファラル設定を更新しました！\n📝 成立タスク: **ログイン${config.referralLoginCount}回**\n🎁 確定ボーナス: **${config.referralBonusGem} GEM**\n🔄 パッシブ還元: **${config.referralPassiveRate * 100}%** を **${config.referralPassiveDays}日間**`
            });
        } else if (subcommand === 'log') {
            const channel = interaction.options.getChannel('channel', true);

            await prisma.guildConfig.upsert({
                where: { guildId },
                update: { logChannelId: channel.id },
                create: { guildId, logChannelId: channel.id }
            });

            await interaction.editReply({
                content: `✅ ログ通知先を <#${channel.id}> に設定しました！エラーやリファラルの警告などがここに通知されます。`
            });
        }
    } catch (error) {
        console.error('Config command error:', error);
        await interaction.editReply({ content: '❌ 設定の保存中にエラーが発生しました。' });
    }
}
