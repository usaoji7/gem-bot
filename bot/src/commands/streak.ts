import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags, StringSelectMenuInteraction } from 'discord.js';
import { prisma } from '../prisma.js';

export const data = new SlashCommandBuilder()
    .setName('gem-streak')
    .setDescription('【管理者専用】連続ログインおよび特権ロールのバフ設定を管理します。')
    .addSubcommand(subcommand =>
        subcommand
            .setName('setup')
            .setDescription('特定の連続ログイン日数（Streak）に到達した際の報酬を設定します。')
            .addIntegerOption(option => option.setName('days').setDescription('達成日数（1〜365）').setRequired(true).setMinValue(1).setMaxValue(365))
            .addIntegerOption(option => option.setName('bonus').setDescription('付与するGEMの量（任意）').setRequired(false).setMinValue(1))
            .addRoleOption(option => option.setName('role').setDescription('付与するロール（任意）').setRequired(false))
            .addNumberOption(option => option.setName('multiplier').setDescription('EXP獲得時の倍率バフ（例: 1.5）（任意）').setRequired(false).setMinValue(1.0).setMaxValue(5.0))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('manage')
            .setDescription('現在設定されている連続ログインボーナス一覧を表示し、不要なものを削除します。')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('role-add')
            .setDescription('指定した特権ロールを持っているメンバーに常時EXP倍率バフを付与します。')
            .addRoleOption(option => option.setName('role').setDescription('バフを付与するロール').setRequired(true))
            .addNumberOption(option => option.setName('multiplier').setDescription('EXP獲得時の倍率（例: 1.25）').setRequired(true).setMinValue(1.0).setMaxValue(5.0))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('role-manage')
            .setDescription('登録されている特権ロールのバフ設定一覧を表示し、不要なものを削除します。')
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
        const { isPremiumOrTrial } = await import('../services/subscription.js');
        const hasPremium = await isPremiumOrTrial(guildId);

        if (subcommand === 'setup') {
            const days = interaction.options.getInteger('days', true);
            const bonusGem = interaction.options.getInteger('bonus');
            const role = interaction.options.getRole('role');
            const multiplier = interaction.options.getNumber('multiplier');

            if (!hasPremium && (role !== null || multiplier !== null)) {
                return interaction.editReply({ content: '🌟 **FREEプランでは連続ログインの「コインボーナス」のみ設定可能です。特権ロールやEXPバフの紐付けはプレミアム限定機能です！**' });
            }

            if (bonusGem === null && role === null && multiplier === null) {
                return interaction.editReply({ content: '❌ `bonus`（GEM）、 `role`（ロール）、または `multiplier`（EXP倍率）のいずれか一つは必ず設定してください。' });
            }

            const existingConfigs = await prisma.streakConfig.findMany({ where: { guildId } });
            const isExistingDay = existingConfigs.some(config => config.days === days);

            if (!isExistingDay && existingConfigs.length >= 10) {
                return interaction.editReply({ content: '❌ 1サーバーにつき登録できる連続ログイン設定は最大10件までです。不要な設定を削除してください。' });
            }

            await prisma.streakConfig.upsert({
                where: { guildId_days: { guildId, days } },
                update: { bonusGem, roleId: role?.id || null, multiplier },
                create: { guildId, days, bonusGem, roleId: role?.id || null, multiplier }
            });

            const rewardText = [];
            if (bonusGem) rewardText.push(`🪙 **${bonusGem}** GEM`);
            if (role) rewardText.push(`🏷️ <@&${role.id}>`);
            if (multiplier) rewardText.push(`🚀 EXP倍率 **${multiplier}倍**`);

            await interaction.editReply({ content: `✅ 連続ログインボーナスを設定しました！\n📅 達成日数: **${days}日**\n🎁 報酬: ${rewardText.join(' / ')}` });

        } else if (subcommand === 'manage') {
            const configs = await prisma.streakConfig.findMany({ where: { guildId }, orderBy: { days: 'asc' } });

            if (configs.length === 0) {
                return interaction.editReply({ content: '📝 登録されている連続ログインボーナスはありません。' });
            }

            const options = configs.map(config => {
                let desc = [];
                if (config.bonusGem) desc.push(`${config.bonusGem} GEM`);
                if (config.roleId) desc.push(`ロール付与`);
                if (config.multiplier) desc.push(`EXP ${config.multiplier}倍`);
                return {
                    label: `${config.days}日連続ログイン`,
                    description: desc.join(' / '),
                    value: config.id.toString()
                };
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('streak_delete_select')
                .setPlaceholder('削除するボーナス設定を選択してください')
                .addOptions(options);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            await interaction.editReply({
                content: '🗑️ 削除したい連続ログインボーナス設定を選択してください。',
                components: [row]
            });

        } else if (subcommand === 'role-add') {
            if (!hasPremium) {
                return interaction.editReply({ content: '🌟 **FREEプランでは特権ロール（常時EXP倍率バフ）機能は利用できません。プレミアムプランへアップグレードしてください！**' });
            }
            const role = interaction.options.getRole('role', true);
            const multiplier = interaction.options.getNumber('multiplier', true);

            const existingCount = await prisma.guildRoleMultiplier.count({ where: { guildId, type: 'PRIVILEGE' } });
            const isExisting = await prisma.guildRoleMultiplier.findUnique({
                where: { guildId_roleId: { guildId, roleId: role.id } }
            });

            if (!isExisting && existingCount >= 20) {
                return interaction.editReply({ content: '❌ 1サーバーにつき登録できる特権ロール設定は最大20件までです。' });
            }

            await prisma.guildRoleMultiplier.upsert({
                where: { guildId_roleId: { guildId, roleId: role.id } },
                update: { multiplier, type: 'PRIVILEGE' },
                create: { guildId, roleId: role.id, multiplier, type: 'PRIVILEGE' }
            });

            await interaction.editReply({ content: `✅ 特権ロールのバフを設定しました！\n🏷️ 対象ロール: <@&${role.id}>\n🚀 EXP倍率: **${multiplier}倍**` });

        } else if (subcommand === 'role-manage') {
            const multipliers = await prisma.guildRoleMultiplier.findMany({ where: { guildId, type: 'PRIVILEGE' } });

            if (multipliers.length === 0) {
                return interaction.editReply({ content: '📝 登録されている特権ロールのバフ設定はありません。' });
            }

            const options = multipliers.map(m => ({
                label: `EXP倍率: ${m.multiplier}倍`,
                description: `削除対象のバフ設定`,
                value: m.roleId
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('streak_role_delete_select')
                .setPlaceholder('削除する設定を選択してください')
                .addOptions(options);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            await interaction.editReply({
                content: '🗑️ 削除したい特権ロールのバフ設定を選択してください。',
                components: [row]
            });
        }
    } catch (error) {
        console.error('Streak command error:', error);
        await interaction.editReply({ content: '❌ コマンドの実行中にエラーが発生しました。' });
    }
}

export async function handleStreakSelect(interaction: StringSelectMenuInteraction) {
    const configId = parseInt(interaction.values[0] || '', 10);
    if (isNaN(configId)) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const deleted = await prisma.streakConfig.delete({ where: { id: configId } });
        await interaction.editReply({ content: `✅ **${deleted.days}日連続ログイン** のボーナス設定を削除しました。` });
    } catch (error) {
        console.error('Streak delete error:', error);
        await interaction.editReply({ content: '❌ 削除中にエラーが発生しました。' });
    }
}

export async function handleStreakRoleSelect(interaction: StringSelectMenuInteraction) {
    const guildId = interaction.guildId;
    const roleId = interaction.values[0];
    if (!guildId || !roleId) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        await prisma.guildRoleMultiplier.delete({ where: { guildId_roleId: { guildId, roleId } } });
        await interaction.editReply({ content: `✅ 指定された特権ロールバフ（対象ロール: <@&${roleId}>）の設定を削除しました。` });
    } catch (error) {
        console.error('Streak role delete error:', error);
        await interaction.editReply({ content: '❌ 削除中にエラーが発生しました。' });
    }
}
