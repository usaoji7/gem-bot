import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ChannelType } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-panel')
    .setDescription('【管理者専用】各種機能ボタンのパネルをチャンネルに設置します。')
    .addSubcommand(subcommand =>
        subcommand
            .setName('bonus')
            .setDescription('ログインボーナスまたはルーレットのボタンを設置します。')
            .addIntegerOption(option => option.setName('min').setDescription('最小ポイント').setRequired(true).setMinValue(1))
            .addIntegerOption(option => option.setName('max').setDescription('最大ポイント').setRequired(true).setMinValue(1))
            .addStringOption(option => option.setName('target').setDescription('対象').setRequired(true)
                .addChoices({ name: '自分に付与（ログインボーナス）', value: 'self' }, { name: 'ランダムな他人に付与（ルーレット）', value: 'random' }))
            .addIntegerOption(option => option.setName('cost').setDescription('実行に必要な消費ポイント（ルーレット用）').setRequired(false).setMinValue(0))
            .addStringOption(option => option.setName('title').setDescription('メッセージのタイトル').setRequired(false))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('ticket')
            .setDescription('お問い合わせやサポート用のチケット作成ボタンを設置します。')
            .addRoleOption(option => option.setName('role1').setDescription('チケットを閲覧できるロール（運営など）').setRequired(true))
            .addRoleOption(option => option.setName('role2').setDescription('追加の閲覧可能ロール').setRequired(false))
            .addRoleOption(option => option.setName('role3').setDescription('追加の閲覧可能ロール').setRequired(false))
            .addChannelOption(option => option.setName('category').setDescription('チケットを作成するカテゴリ（カテゴリ内のチャンネルを指定してもOK）').setRequired(false))
            .addStringOption(option => option.setName('title').setDescription('メッセージのタイトル').setRequired(false))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('invite')
            .setDescription('リファラル用の招待リンク発行パネルを設置します。')
            .addStringOption(option => option.setName('title').setDescription('メッセージのタイトル').setRequired(false))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId || !interaction.channel) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', flags: MessageFlags.Ephemeral });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { isPremiumOrTrial } = await import('../services/subscription.js');
    const hasPremium = await isPremiumOrTrial(guildId);

    const guildConfig = await prisma.guildConfig.findUnique({
        where: { guildId: guildId },
    });
    const currencyName = guildConfig?.coinName || 'GEM';

    try {
        if (subcommand === 'bonus') {
            const min = interaction.options.getInteger('min', true);
            const max = interaction.options.getInteger('max', true);
            const target = interaction.options.getString('target', true);
            const cost = interaction.options.getInteger('cost') || 0;
            const title = interaction.options.getString('title') || (target === 'self' ? '🎁 ログインボーナス' : '🎲 交流ルーレット');

            if (min > max) {
                return interaction.editReply({ content: '❌ `min` は `max` 以下の値にしてください。' });
            }

            if (!hasPremium) {
                const existingCount = await prisma.bonusButton.count({ where: { guildId, target } });
                if (existingCount >= 1) {
                    await interaction.editReply({ content: `🌟 **FREEプランでは「${target === 'self' ? 'ログインボーナス' : 'ルーレット'}」パネルはサーバー内で1つまでしか設置できません。プレミアムプランへアップグレードしてください！**` });
                    return;
                }
            }

            const buttonRecord = await prisma.bonusButton.create({
                data: {
                    guildId,
                    channelId: interaction.channel.id,
                    minReward: min,
                    maxReward: max,
                    target: target,
                    cost: target === 'random' ? cost : 0,
                }
            });

            const emoji = target === 'self' ? '🎁' : '🎲';
            const label = target === 'self' ? 'ボーナスを受け取る' : 'ルーレットを回す';
            const style = target === 'self' ? ButtonStyle.Success : ButtonStyle.Primary;

            const button = new ButtonBuilder()
                .setCustomId(`bonus_${buttonRecord.id}`)
                .setLabel(label)
                .setEmoji(emoji)
                .setStyle(style);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

            if (interaction.channel?.isTextBased()) {
                await (interaction.channel as any).send({
                    content: `**${title}**\nボタンを押して${currencyName}を獲得しましょう！`,
                    components: [row]
                });
            }

            await interaction.editReply({ content: '✅ ボーナスボタンを設置しました！' });

        } else if (subcommand === 'ticket') {
            if (!hasPremium) {
                await interaction.editReply({ content: '🌟 **FREEプランではチケットツール機能は利用できません。プレミアムプランへアップグレードしてください！**' });
                return;
            }
            const role1 = interaction.options.getRole('role1', true);
            const role2 = interaction.options.getRole('role2');
            const role3 = interaction.options.getRole('role3');
            const category = interaction.options.getChannel('category');
            const title = interaction.options.getString('title') || '📩 サポートチケット';

            const roles = [role1.id];
            if (role2) roles.push(role2.id);
            if (role3) roles.push(role3.id);

            let finalCategoryId = null;
            if (category) {
                if (category.type === ChannelType.GuildCategory) {
                    finalCategoryId = category.id;
                } else if ('parentId' in category && category.parentId) {
                    finalCategoryId = category.parentId;
                } else {
                    return interaction.editReply({ content: '❌ 指定されたチャンネルはカテゴリに属していません。カテゴリそのものか、カテゴリ内のチャンネルを選択してください。' });
                }
            }

            const buttonRecord = await prisma.ticketButton.create({
                data: {
                    guildId,
                    categoryId: finalCategoryId,
                    roleIds: roles.join(','),
                }
            });

            const button = new ButtonBuilder()
                .setCustomId(`ticket_open_${buttonRecord.id}`)
                .setLabel('チケットを作成')
                .setEmoji('📩')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

            if (interaction.channel?.isTextBased()) {
                await (interaction.channel as any).send({
                    content: `**${title}**\n下のボタンを押すと、専用のプライベートチャンネルが作成されます。`,
                    components: [row]
                });
            }

            await interaction.editReply({ content: '✅ チケット作成ボタンを設置しました！' });

        } else if (subcommand === 'invite') {
            if (!hasPremium) {
                await interaction.editReply({ content: '🌟 **FREEプランではリファラル（友達招待）機能は利用できません。プレミアムプランへアップグレードしてください！**' });
                return;
            }
            const title = interaction.options.getString('title') || '🤝 友達招待（リファラル）リンク発行';

            const button = new ButtonBuilder()
                .setCustomId(`invite_generate`)
                .setLabel('専用の招待リンクを発行する')
                .setEmoji('🔗')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

            if (interaction.channel?.isTextBased()) {
                await (interaction.channel as any).send({
                    content: `**${title}**\n友達をサーバーに招待して、紹介特典（${currencyName}とパッシブEXP還元）を獲得しましょう！\n下のボタンを押すと、あなた専用の招待リンクが発行されます。`,
                    components: [row]
                });
            }

            await interaction.editReply({ content: '✅ リファラル招待パネルを設置しました！' });
        }
    } catch (error) {
        console.error('Panel command error:', error);
        await interaction.editReply({ content: '❌ パネルの設置中にエラーが発生しました。' });
    }
}
