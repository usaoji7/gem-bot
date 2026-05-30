import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-ticket-setup')
    .setDescription('【管理者専用】サポートチケットを作成するボタンを設置します。')
    .addRoleOption(option =>
        option.setName('role1').setDescription('チケットに招待する対応者ロール1').setRequired(true)
    )
    .addRoleOption(option =>
        option.setName('role2').setDescription('チケットに招待する対応者ロール2（任意）').setRequired(false)
    )
    .addRoleOption(option =>
        option.setName('role3').setDescription('チケットに招待する対応者ロール3（任意）').setRequired(false)
    )
    .addChannelOption(option =>
        option.setName('category')
            .setDescription('チケット（チャンネル）を作成するカテゴリ（任意・未指定時はこのカテゴリ）')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('title').setDescription('メッセージのタイトル（任意）').setRequired(false)
    )
    .addStringOption(option =>
        option.setName('description').setDescription('メッセージの説明（任意）').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', ephemeral: true });
        return;
    }

    const role1 = interaction.options.getRole('role1', true);
    const role2 = interaction.options.getRole('role2');
    const role3 = interaction.options.getRole('role3');
    
    const categoryOption = interaction.options.getChannel('category');
    let categoryId: string | null = null;
    
    if (categoryOption) {
        categoryId = categoryOption.id;
    } else if (interaction.channel && !interaction.channel.isDMBased() && interaction.channel.parentId) {
        categoryId = interaction.channel.parentId;
    }

    const title = interaction.options.getString('title') || '📩 お問い合わせ / サポートチケット';
    const description = interaction.options.getString('description') || 'ボタンをクリックすると、運営とあなただけのプライベートチャンネルが作成されます。\n質問や相談がある場合はこちらからどうぞ。';

    const roles = [role1.id];
    if (role2) roles.push(role2.id);
    if (role3) roles.push(role3.id);

    await interaction.deferReply({ ephemeral: true });

    try {
        const ticketButton = await prisma.ticketButton.create({
            data: {
                guildId: guildId,
                categoryId: categoryId,
                roleIds: roles.join(','),
            }
        });

        const button = new ButtonBuilder()
            .setCustomId(`ticket_open_${ticketButton.id}`)
            .setStyle(ButtonStyle.Primary)
            .setLabel('🎫 チケットを作成する');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        if (interaction.channel && interaction.channel.isTextBased() && 'send' in interaction.channel) {
            await interaction.channel.send({
                content: `**${title}**\n${description}`,
                components: [row],
            });
        }

        await interaction.editReply({ content: '✅ チケットボタンを設置しました！' });

    } catch (error) {
        console.error('Ticket setup command error:', error);
        await interaction.editReply({ content: '❌ ボタンの設置中にエラーが発生しました。' });
    }
}
