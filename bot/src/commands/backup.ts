import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags, AttachmentBuilder } from 'discord.js';
import { prisma } from '../prisma.js';
import { z } from 'zod';

export const data = new SlashCommandBuilder()
    .setName('gem-backup')
    .setDescription('【管理者専用】サーバー設定のバックアップと復元を行います。')
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('現在のサーバー設定をJSONファイルとして出力（バックアップ）します。')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('restore')
            .setDescription('JSONファイルからサーバー設定を復元します。')
            .addAttachmentOption(option =>
                option.setName('file')
                    .setDescription('復元するバックアップファイル（.json）')
                    .setRequired(true)
            )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// --------------------------------------------------------------------------------
// Zod schemas for validation
// --------------------------------------------------------------------------------
const GuildConfigSchema = z.object({
    coinName: z.string(),
    logChannelId: z.string().nullable(),
    textExpLimit: z.number(),
    reactionExpLimit: z.number(),
    referralLoginCount: z.number(),
    referralBonusGem: z.number(),
    referralPassiveRate: z.number(),
    referralPassiveDays: z.number(),
});

const StoreItemSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    roleId: z.string().nullable(),
});

const BonusButtonSchema = z.object({
    id: z.string(),
    channelId: z.string(),
    minReward: z.number(),
    maxReward: z.number(),
    target: z.string(),
    cost: z.number(),
});

const TicketButtonSchema = z.object({
    id: z.string(),
    categoryId: z.string().nullable(),
    roleIds: z.string(),
});

const StreakConfigSchema = z.object({
    days: z.number(),
    bonusGem: z.number().nullable(),
    roleId: z.string().nullable(),
    multiplier: z.number().nullable(),
});

const GuildRoleMultiplierSchema = z.object({
    roleId: z.string(),
    multiplier: z.number(),
    type: z.string(),
});

const BackupSchema = z.object({
    guildConfig: GuildConfigSchema.nullable(),
    storeItems: z.array(StoreItemSchema),
    bonusButtons: z.array(BonusButtonSchema),
    ticketButtons: z.array(TicketButtonSchema),
    streakConfigs: z.array(StreakConfigSchema),
    guildRoleMultipliers: z.array(GuildRoleMultiplierSchema),
});

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId || !interaction.guild) {
        await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ実行できます。', flags: MessageFlags.Ephemeral });
        return;
    }

    const { isPremiumOrTrial } = await import('../services/subscription.js');
    if (!(await isPremiumOrTrial(guildId))) {
        await interaction.reply({ content: '🌟 **FREEプランではバックアップ機能は利用できません。プレミアムプランへアップグレードしてください！**', flags: MessageFlags.Ephemeral });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        if (subcommand === 'create') {
            // ----- CREATE BACKUP -----
            const [
                guildConfig,
                storeItems,
                bonusButtons,
                ticketButtons,
                streakConfigs,
                guildRoleMultipliers
            ] = await Promise.all([
                prisma.guildConfig.findUnique({ where: { guildId } }),
                prisma.storeItem.findMany({ where: { guildId } }),
                prisma.bonusButton.findMany({ where: { guildId } }),
                prisma.ticketButton.findMany({ where: { guildId } }),
                prisma.streakConfig.findMany({ where: { guildId } }),
                prisma.guildRoleMultiplier.findMany({ where: { guildId } }),
            ]);

            const backupData = {
                guildConfig: guildConfig ? {
                    coinName: guildConfig.coinName,
                    logChannelId: guildConfig.logChannelId,
                    textExpLimit: guildConfig.textExpLimit,
                    reactionExpLimit: guildConfig.reactionExpLimit,
                    referralLoginCount: guildConfig.referralLoginCount,
                    referralBonusGem: guildConfig.referralBonusGem,
                    referralPassiveRate: guildConfig.referralPassiveRate,
                    referralPassiveDays: guildConfig.referralPassiveDays,
                } : null,
                storeItems: storeItems.map(i => ({
                    id: i.id,
                    name: i.name,
                    description: i.description,
                    price: i.price,
                    roleId: i.roleId,
                })),
                bonusButtons: bonusButtons.map(b => ({
                    id: b.id,
                    channelId: b.channelId,
                    minReward: b.minReward,
                    maxReward: b.maxReward,
                    target: b.target,
                    cost: b.cost,
                })),
                ticketButtons: ticketButtons.map(t => ({
                    id: t.id,
                    categoryId: t.categoryId,
                    roleIds: t.roleIds,
                })),
                streakConfigs: streakConfigs.map(s => ({
                    days: s.days,
                    bonusGem: s.bonusGem,
                    roleId: s.roleId,
                    multiplier: s.multiplier,
                })),
                guildRoleMultipliers: guildRoleMultipliers.map(g => ({
                    roleId: g.roleId,
                    multiplier: g.multiplier,
                    type: g.type,
                }))
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const buffer = Buffer.from(jsonString, 'utf-8');
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `backup_${guildId}_${dateStr}.json`;

            const attachment = new AttachmentBuilder(buffer, { name: fileName });

            await interaction.editReply({
                content: `✅ サーバー設定のバックアップが完了しました！\n添付のJSONファイルを大切に保管してください。\n復元する際は、\`/gem-backup restore\` コマンドでこのファイルをアップロードしてください。`,
                files: [attachment]
            });

        } else if (subcommand === 'restore') {
            // ----- RESTORE BACKUP -----
            const attachment = interaction.options.getAttachment('file', true);

            if (!attachment.name.endsWith('.json')) {
                await interaction.editReply({ content: '❌ エラー: .json ファイルをアップロードしてください。' });
                return;
            }

            const response = await fetch(attachment.url);
            if (!response.ok) {
                await interaction.editReply({ content: '❌ エラー: ファイルのダウンロードに失敗しました。' });
                return;
            }

            let rawData;
            try {
                rawData = await response.json();
            } catch (e) {
                await interaction.editReply({ content: '❌ エラー: ファイルが有効なJSONではありません。' });
                return;
            }

            const parseResult = BackupSchema.safeParse(rawData);
            if (!parseResult.success) {
                console.error("Backup Validation Error:", parseResult.error);
                await interaction.editReply({
                    content: '❌ エラー: JSONファイルの構造が正しくありません。\n内容が改ざんされているか、古いバージョンのバックアップである可能性があります。'
                });
                return;
            }

            const data = parseResult.data;

            await prisma.$transaction(async (tx) => {
                // 1. GuildConfig
                if (data.guildConfig) {
                    await tx.guildConfig.upsert({
                        where: { guildId },
                        update: data.guildConfig,
                        create: { ...data.guildConfig, guildId },
                    });
                }

                // 2. StoreItems
                for (const item of data.storeItems) {
                    const existing = await tx.storeItem.findUnique({ where: { id: item.id } });
                    if (existing && existing.guildId === guildId) {
                        const { id, ...updateData } = item;
                        await tx.storeItem.update({
                            where: { id: item.id },
                            data: updateData,
                        });
                    } else if (!existing) {
                        await tx.storeItem.create({
                            data: { ...item, guildId },
                        });
                    } else {
                        // Conflict with another guild, create with new ID
                        const { id, ...createData } = item;
                        await tx.storeItem.create({
                            data: { ...createData, guildId },
                        });
                    }
                }

                // 3. BonusButtons (UUID)
                for (const btn of data.bonusButtons) {
                    const existing = await tx.bonusButton.findUnique({ where: { id: btn.id } });
                    if (existing && existing.guildId === guildId) {
                        const { id, ...updateData } = btn;
                        await tx.bonusButton.update({
                            where: { id: btn.id },
                            data: updateData,
                        });
                    } else if (!existing) {
                        await tx.bonusButton.create({
                            data: { ...btn, guildId },
                        });
                    } else {
                        const { id, ...createData } = btn;
                        await tx.bonusButton.create({
                            data: { ...createData, guildId },
                        });
                    }
                }

                // 4. TicketButtons (UUID)
                for (const btn of data.ticketButtons) {
                    const existing = await tx.ticketButton.findUnique({ where: { id: btn.id } });
                    if (existing && existing.guildId === guildId) {
                        const { id, ...updateData } = btn;
                        await tx.ticketButton.update({
                            where: { id: btn.id },
                            data: updateData,
                        });
                    } else if (!existing) {
                        await tx.ticketButton.create({
                            data: { ...btn, guildId },
                        });
                    } else {
                        const { id, ...createData } = btn;
                        await tx.ticketButton.create({
                            data: { ...createData, guildId },
                        });
                    }
                }

                // 5. StreakConfigs (Unique by guildId_days)
                for (const streak of data.streakConfigs) {
                    await tx.streakConfig.upsert({
                        where: {
                            guildId_days: {
                                guildId,
                                days: streak.days,
                            }
                        },
                        update: {
                            bonusGem: streak.bonusGem,
                            roleId: streak.roleId,
                            multiplier: streak.multiplier,
                        },
                        create: {
                            guildId,
                            days: streak.days,
                            bonusGem: streak.bonusGem,
                            roleId: streak.roleId,
                            multiplier: streak.multiplier,
                        },
                    });
                }

                // 6. GuildRoleMultipliers (Unique by guildId_roleId)
                for (const roleMult of data.guildRoleMultipliers) {
                    await tx.guildRoleMultiplier.upsert({
                        where: {
                            guildId_roleId: {
                                guildId,
                                roleId: roleMult.roleId,
                            }
                        },
                        update: {
                            multiplier: roleMult.multiplier,
                            type: roleMult.type,
                        },
                        create: {
                            guildId,
                            roleId: roleMult.roleId,
                            multiplier: roleMult.multiplier,
                            type: roleMult.type,
                        },
                    });
                }
            });

            await interaction.editReply({
                content: '✅ サーバー設定の復元が完了しました！\n（一部の無効なロールやチャンネルが設定に含まれている場合、各機能の利用時にエラーとしてログチャンネルに通知されます）'
            });
        }
    } catch (error) {
        console.error('Backup command error:', error);
        await interaction.editReply({ content: '❌ コマンドの実行中にエラーが発生しました。ログを確認してください。' });
    }
}
