import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('store')
    .setDescription('現在ストアで販売されている商品の一覧を表示します。');

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: guildId },
        });
        const currencyName = guildConfig?.coinName || 'GEM';

        const items = await prisma.storeItem.findMany({
            where: { guildId: guildId },
            orderBy: { id: 'asc' },
        });

        if (items.length === 0) {
            await interaction.editReply({ content: '🛍️ 現在、ストアに販売されている商品はありません。' });
            return;
        }

        let storeList = `🛍️ **ストアの商品一覧** 🛍️\n（購入するには \`/buy [ID]\` コマンドを使用してください）\n\n`;
        for (const item of items) {
            const roleMention = item.roleId ? `[ロール付与: <@&${item.roleId}>]` : '';
            const desc = item.description ? `\n   └ 📝 ${item.description}` : '';
            storeList += `🔹 **ID: ${item.id}** | **${item.name}**\n   └ 💰 価格: **${item.price} ${currencyName}** ${roleMention}${desc}\n\n`;
        }

        await interaction.editReply({ content: storeList });
    } catch (error) {
        console.error('Store list command error:', error);
        await interaction.editReply({ content: '❌ ストアの情報の取得中にエラーが発生しました。' });
    }
}
