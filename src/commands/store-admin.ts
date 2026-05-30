import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-store')
    .setDescription('【管理者専用】ストアの商品の追加・削除を行います。')
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('ストアに新しい商品（ロール等）を追加します。')
            .addStringOption(option =>
                option.setName('name').setDescription('商品名').setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('price').setDescription('価格（必要なコイン数）').setRequired(true).setMinValue(1)
            )
            .addRoleOption(option =>
                option.setName('role').setDescription('購入時に付与するロール').setRequired(false)
            )
            .addStringOption(option =>
                option.setName('description').setDescription('商品の説明').setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('ストアから商品を削除します。')
            .addIntegerOption(option =>
                option.setName('item_id').setDescription('削除する商品のID').setRequired(true)
            )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', ephemeral: true });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    try {
        if (subcommand === 'add') {
            const name = interaction.options.getString('name', true);
            const price = interaction.options.getInteger('price', true);
            const role = interaction.options.getRole('role');
            const description = interaction.options.getString('description');

            const item = await prisma.storeItem.create({
                data: {
                    guildId: guildId,
                    name: name,
                    price: price,
                    roleId: role?.id || null,
                    description: description,
                }
            });

            const roleMention = role ? `（付与ロール: <@&${role.id}>）` : '';
            await interaction.editReply({
                content: `✅ ストアに商品を追加しました！\nID: **${item.id}** | 商品名: **${item.name}** | 価格: **${item.price}** ${roleMention}`,
            });

        } else if (subcommand === 'remove') {
            const itemId = interaction.options.getInteger('item_id', true);

            const existingItem = await prisma.storeItem.findUnique({
                where: { id: itemId }
            });

            if (!existingItem || existingItem.guildId !== guildId) {
                await interaction.editReply({ content: '❌ 指定されたIDの商品が見つかりません。' });
                return;
            }

            await prisma.storeItem.delete({
                where: { id: itemId }
            });

            await interaction.editReply({
                content: `✅ 商品（ID: ${itemId}, 名前: ${existingItem.name}）をストアから削除しました。`,
            });
        }
    } catch (error) {
        console.error('Store admin command error:', error);
        await interaction.editReply({ content: '❌ ストアの操作中にエラーが発生しました。' });
    }
}
