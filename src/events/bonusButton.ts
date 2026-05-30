import { ButtonInteraction } from 'discord.js';
import { prisma } from '../prisma.js';

export async function handleBonusButton(interaction: ButtonInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    // customId is formatted as "bonus_UUID"
    const buttonId = interaction.customId.replace('bonus_', '');

    try {
        const bonusButton = await prisma.bonusButton.findUnique({
            where: { id: buttonId }
        });

        if (!bonusButton || bonusButton.guildId !== guildId) {
            await interaction.reply({ content: '❌ このボタンの設定が見つかりません。（削除された可能性があります）', ephemeral: true });
            return;
        }

        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: guildId },
        });
        const currencyName = guildConfig?.coinName || 'GEM';

        if (bonusButton.target === 'self') {
            await handleSelfBonus(interaction, bonusButton, currencyName);
        } else if (bonusButton.target === 'random') {
            await handleRandomBonus(interaction, bonusButton, currencyName);
        }
    } catch (error) {
        console.error('Bonus button error:', error);
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: '❌ エラーが発生しました。', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ エラーが発生しました。', ephemeral: true });
        }
    }
}

async function handleSelfBonus(interaction: ButtonInteraction, bonusButton: any, currencyName: string) {
    await interaction.deferReply({ ephemeral: true }); // 自分向けは ephemeral

    const now = new Date();
    // JST 0時を基準にするため、UTC時間に9時間足して日付文字列を作り、それで比較する
    // UTC 15:00 以降が JST 0:00 なので、JSTの日付を取得
    const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    jstDate.setUTCHours(0, 0, 0, 0); // JSTの0時0分0秒 (UTCベースで時間をリセット)

    // このユーザーのこのボタンに対する最新のClaimを取得
    const lastClaim = await prisma.bonusClaim.findFirst({
        where: {
            buttonId: bonusButton.id,
            discordId: interaction.user.id,
        },
        orderBy: { claimedAt: 'desc' },
    });

    if (lastClaim) {
        const lastJstDate = new Date(lastClaim.claimedAt.getTime() + 9 * 60 * 60 * 1000);
        lastJstDate.setUTCHours(0, 0, 0, 0);
        if (lastJstDate.getTime() === jstDate.getTime()) {
            await interaction.editReply({ content: '⚠️ 今日のログインボーナスは既に受け取り済みです！明日（深夜0時リセット）また来てください。' });
            return;
        }
    }

    const reward = Math.floor(Math.random() * (bonusButton.maxReward - bonusButton.minReward + 1)) + bonusButton.minReward;

    await prisma.$transaction([
        prisma.user.upsert({
            where: {
                guildId_discordId: {
                    guildId: bonusButton.guildId,
                    discordId: interaction.user.id,
                }
            },
            update: { points: { increment: reward } },
            create: { guildId: bonusButton.guildId, discordId: interaction.user.id, points: reward },
        }),
        prisma.bonusClaim.create({
            data: {
                guildId: bonusButton.guildId,
                buttonId: bonusButton.id,
                discordId: interaction.user.id,
            }
        })
    ]);

    await interaction.editReply({ content: `🎁 ログインボーナス獲得！\n**${reward} ${currencyName}** を受け取りました！` });
}

async function handleRandomBonus(interaction: ButtonInteraction, bonusButton: any, currencyName: string) {
    // 他人向けはパブリック通知を出すため ephemeral を false にする
    // ただし、残高不足などのエラーの場合は ephemeral にしたいため、一旦 defer しないか ephemeral でチェックだけする
    // 今回は defer せずにチェックを先行する
    const userRecord = await prisma.user.findUnique({
        where: {
            guildId_discordId: {
                guildId: bonusButton.guildId,
                discordId: interaction.user.id,
            }
        }
    });

    if (!userRecord || userRecord.points < bonusButton.cost) {
        await interaction.reply({ content: `❌ ポイントが足りません！\n（必要: **${bonusButton.cost} ${currencyName}**, 現在: **${userRecord?.points || 0} ${currencyName}**）`, ephemeral: true });
        return;
    }

    // defer (public)
    await interaction.deferReply({ ephemeral: false });

    if (!interaction.guild) throw new Error('Guild not found');

    // DBからこのサーバーの登録ユーザーを取得
    const serverUsers = await prisma.user.findMany({
        where: { guildId: bonusButton.guildId }
    });
    const dbUserIds = serverUsers.map(u => u.discordId);

    // Discordのキャッシュからユーザーを取得（最近発言した人など）
    const cachedUserIds = interaction.guild.members.cache
        .filter(m => !m.user.bot)
        .map(m => m.id);

    // DBのユーザーとキャッシュのユーザーを結合し、重複を排除
    const allCandidateIds = Array.from(new Set([...dbUserIds, ...cachedUserIds]));

    // 実行者本人以外のユーザーを抽出
    const candidateIds = allCandidateIds.filter(id => id !== interaction.user.id);

    if (candidateIds.length === 0) {
        await interaction.editReply({ content: '⚠️ ルーレットの対象となる他のユーザーが見つかりません。\n（※他の人が一度でも `/gem-balance` を使用するか、発言すると抽選対象になります）' });
        return;
    }

    const randomMemberId = candidateIds[Math.floor(Math.random() * candidateIds.length)]!;

    const reward = Math.floor(Math.random() * (bonusButton.maxReward - bonusButton.minReward + 1)) + bonusButton.minReward;

    await prisma.$transaction([
        // 実行者のポイントを減らす
        prisma.user.update({
            where: {
                guildId_discordId: {
                    guildId: bonusButton.guildId,
                    discordId: interaction.user.id,
                }
            },
            data: { points: { decrement: bonusButton.cost } }
        }),
        // 当選者のポイントを増やす
        prisma.user.upsert({
            where: {
                guildId_discordId: {
                    guildId: bonusButton.guildId,
                    discordId: randomMemberId,
                }
            },
            update: { points: { increment: reward } },
            create: { guildId: bonusButton.guildId, discordId: randomMemberId, points: reward },
        })
    ]);

    await interaction.editReply({
        content: `🎲 <@${interaction.user.id}> さんが **${bonusButton.cost} ${currencyName}** を消費してルーレットを回しました！\n\n🎉 <@${randomMemberId}> さんに **${reward} ${currencyName}** を付与！おめでとうございます！！\n<@${interaction.user.id}> さんにお礼を一言伝えましょうね`
    });
}
