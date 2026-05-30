import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-bonus-setup')
    .setDescription('【管理者専用】ログインボーナスやランダム付与のルーレットボタンを設置します。')
    .addIntegerOption(option =>
        option.setName('min').setDescription('付与するポイントの最小値').setRequired(true).setMinValue(1)
    )
    .addIntegerOption(option =>
        option.setName('max').setDescription('付与するポイントの最大値').setRequired(true).setMinValue(1)
    )
    .addStringOption(option =>
        option.setName('target')
            .setDescription('付与先（デフォルトは自分）')
            .setRequired(true)
            .addChoices(
                { name: '自分（1日1回限定のログインボーナス）', value: 'self' },
                { name: 'ランダムな誰か（ポイントを消費して他人に付与）', value: 'random' }
            )
    )
    .addIntegerOption(option =>
        option.setName('cost').setDescription('【ランダムな誰かの場合】ボタンを押す人が消費するポイント').setRequired(false).setMinValue(1)
    )
    .addStringOption(option =>
        option.setName('title').setDescription('メッセージのタイトル（任意）').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', ephemeral: true });
        return;
    }

    const minReward = interaction.options.getInteger('min', true);
    const maxReward = interaction.options.getInteger('max', true);
    const targetType = interaction.options.getString('target', true);
    const cost = interaction.options.getInteger('cost') || 0;
    const title = interaction.options.getString('title') || '✨ ログインボーナス / ルーレット ✨';

    if (minReward > maxReward) {
        await interaction.reply({ content: '❌ 最小値（min）は最大値（max）以下に設定してください。', ephemeral: true });
        return;
    }

    if (targetType === 'random' && cost <= 0) {
        await interaction.reply({ content: '❌ 「ランダムな誰か」を選択した場合、消費するポイント（cost）を1以上に設定してください。', ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        // ボタン設定をデータベースに保存
        const bonusButton = await prisma.bonusButton.create({
            data: {
                guildId: guildId,
                channelId: interaction.channelId,
                minReward: minReward,
                maxReward: maxReward,
                target: targetType,
                cost: targetType === 'random' ? cost : 0,
            }
        });

        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: guildId },
        });
        const currencyName = guildConfig?.coinName || 'GEM';

        // 送信するボタンの作成
        const button = new ButtonBuilder()
            .setCustomId(`bonus_${bonusButton.id}`)
            .setStyle(targetType === 'self' ? ButtonStyle.Primary : ButtonStyle.Success)
            .setLabel(targetType === 'self' ? '🎁 ボーナスを受け取る' : '🎲 ルーレットを回す');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        let description = targetType === 'self'
            ? `1日1回限定！ボタンを押して **${minReward}〜${maxReward} ${currencyName}** をゲットしよう！`
            : `**${cost} ${currencyName}** を消費してルーレットを回し、\nサーバーの誰か1人に **${minReward}〜${maxReward} ${currencyName}** をプレゼントします！`;

        // コマンドを実行したチャンネルにメッセージを送信
        if (interaction.channel && interaction.channel.isTextBased() && 'send' in interaction.channel) {
            await interaction.channel.send({
                content: `**${title}**\n${description}`,
                components: [row],
            });
        }

        await interaction.editReply({ content: '✅ ボタンを設置しました！' });

    } catch (error) {
        console.error('Bonus setup command error:', error);
        await interaction.editReply({ content: '❌ ボタンの設置中にエラーが発生しました。' });
    }
}
