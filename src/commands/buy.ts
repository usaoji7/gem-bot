import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('buy')
    .setDescription('ストアで商品をポイントを使って購入します。')
    .addIntegerOption(option =>
        option
            .setName('item_id')
            .setDescription('購入する商品のID（/store で確認できます）')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', ephemeral: true });
        return;
    }

    const itemId = interaction.options.getInteger('item_id', true);
    await interaction.deferReply();

    try {
        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: guildId },
        });
        const currencyName = guildConfig?.coinName || 'GEM';

        // 商品の存在確認
        const item = await prisma.storeItem.findUnique({
            where: { id: itemId }
        });

        if (!item || item.guildId !== guildId) {
            await interaction.editReply({ content: '❌ 指定されたIDの商品が見つかりません。' });
            return;
        }

        // ユーザーの残高確認
        const user = await prisma.user.findUnique({
            where: {
                guildId_discordId: {
                    guildId: guildId,
                    discordId: interaction.user.id,
                }
            }
        });

        if (!user || user.points < item.price) {
            await interaction.editReply({ 
                content: `❌ 残高が不足しています！\n（商品価格: **${item.price} ${currencyName}**, 現在の残高: **${user?.points || 0} ${currencyName}**）` 
            });
            return;
        }

        // ロールの付与処理（商品にロールが設定されている場合）
        if (item.roleId) {
            if (!interaction.guild) throw new Error('Guild not found');
            const member = await interaction.guild.members.fetch(interaction.user.id);

            // 既にロールを持っている場合は購入不可にする
            if (member.roles.cache.has(item.roleId)) {
                await interaction.editReply({ content: '⚠️ すでにそのロールを所有しているため、購入をキャンセルしました。' });
                return;
            }

            const role = interaction.guild.roles.cache.get(item.roleId);

            if (!role) {
                await interaction.editReply({ content: '❌ 商品に設定されているロールがサーバーに見つかりません。管理者に連絡してください。' });
                return;
            }

            // ロール付与の権限チェック（Botより上のロール等はDiscord APIが弾いて例外になる）
            try {
                await member.roles.add(role);
            } catch (roleError) {
                console.error('Role assignment error:', roleError);
                await interaction.editReply({ content: '❌ ロールの付与に失敗しました。（Botの権限不足、またはロールの順位が原因の可能性があります）' });
                return;
            }
        }

        // 残高を減らす
        const updatedUser = await prisma.user.update({
            where: {
                guildId_discordId: {
                    guildId: guildId,
                    discordId: interaction.user.id,
                }
            },
            data: {
                points: {
                    decrement: item.price,
                }
            }
        });

        let successMessage = `✅ **「${item.name}」** を購入しました！`;
        if (item.roleId) {
            successMessage += `\nロール <@&${item.roleId}> が付与されました。`;
        }
        successMessage += `\n(現在の残高: **${updatedUser.points} ${currencyName}**)`;

        await interaction.editReply({ content: successMessage });
    } catch (error) {
        console.error('Buy command error:', error);
        await interaction.editReply({ content: '❌ 商品の購入処理中にエラーが発生しました。' });
    }
}
