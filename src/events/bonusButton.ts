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

    if (!interaction.guild) throw new Error('Guild not found');
    const guild = interaction.guild;

    const now = new Date();
    // JST 0時を基準にするため、UTC時間に9時間足して日付文字列を作り、それで比較する
    const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    jstDate.setUTCHours(0, 0, 0, 0); // JSTの0時0分0秒

    // ユーザー情報の取得（または作成）
    let userRecord = await prisma.user.findUnique({
        where: {
            guildId_discordId: {
                guildId: bonusButton.guildId,
                discordId: interaction.user.id,
            }
        }
    });

    if (!userRecord) {
        userRecord = await prisma.user.create({
            data: { guildId: bonusButton.guildId, discordId: interaction.user.id }
        });
    }

    let newStreakCount = userRecord.streakCount;
    let newTotalLogins = userRecord.totalLogins;

    if (userRecord.lastLoginAt) {
        const lastJstDate = new Date(userRecord.lastLoginAt.getTime() + 9 * 60 * 60 * 1000);
        lastJstDate.setUTCHours(0, 0, 0, 0);

        const diffTime = jstDate.getTime() - lastJstDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            await interaction.editReply({ content: '⚠️ 今日のログインボーナスは既に受け取り済みです！明日（深夜0時リセット）また来てください。' });
            return;
        } else if (diffDays === 1) {
            // 昨日から連続
            newStreakCount += 1;
        } else {
            // 一昨日以前（連続が途切れた）
            newStreakCount = 1;
        }
    } else {
        // 初回ログイン
        newStreakCount = 1;
    }

    newTotalLogins += 1;
    const reward = Math.floor(Math.random() * (bonusButton.maxReward - bonusButton.minReward + 1)) + bonusButton.minReward;

    // 基本報酬の計算
    let totalPointsToAdd = reward;
    let bonusMessage = '';

    // StreakConfigの確認
    const streakConfig = await prisma.streakConfig.findUnique({
        where: {
            guildId_days: {
                guildId: bonusButton.guildId,
                days: newStreakCount
            }
        }
    });

    if (streakConfig) {
        if (streakConfig.bonusGem) {
            totalPointsToAdd += streakConfig.bonusGem;
            bonusMessage += ` 🪙 **${streakConfig.bonusGem}** ${currencyName}`;
        }
        
        if (streakConfig.roleId) {
            try {
                const member = await guild.members.fetch(interaction.user.id);
                if (member) {
                    await member.roles.add(streakConfig.roleId);
                    bonusMessage += ` / 🏷️ <@&${streakConfig.roleId}> ロール`;
                }
            } catch (error) {
                console.error(`Failed to assign role ${streakConfig.roleId} to user ${interaction.user.id}:`, error);
                
                // ギルド設定からlogChannelIdを取得してエラー通知
                const guildConfig = await prisma.guildConfig.findUnique({ where: { guildId: guild.id } });
                if (guildConfig && guildConfig.logChannelId) {
                    try {
                        const logChannel = await guild.channels.fetch(guildConfig.logChannelId);
                        if (logChannel && logChannel.isTextBased() && 'send' in logChannel) {
                            await logChannel.send(`⚠️ **ロール付与エラー**: ユーザー <@${interaction.user.id}> に連続ログインボーナスのロール (<@&${streakConfig.roleId}>) を付与しようとしましたが失敗しました。Botのロール位置や権限を確認してください。`);
                        }
                    } catch (e) {
                        console.error('Failed to send error log:', e);
                    }
                }
            }
        }
    }

    // Referral Tracking
    let referralBonusMessage = '';
    const dbGuildConfig = await prisma.guildConfig.findUnique({ where: { guildId: guild.id } });

    const referral = await prisma.referral.findUnique({
        where: { guildId_childId: { guildId: bonusButton.guildId, childId: interaction.user.id } }
    });

    if (referral && !referral.isActive) {
        const requiredLogins = dbGuildConfig?.referralLoginCount ?? 3;
        const newLoginCount = referral.loginCount + 1;

        if (newLoginCount >= requiredLogins) {
            // Task complete!
            const bonusGem = dbGuildConfig?.referralBonusGem ?? 300;
            const passiveDays = dbGuildConfig?.referralPassiveDays ?? 30;
            const passiveEndsAt = new Date(now.getTime() + passiveDays * 24 * 60 * 60 * 1000);

            await prisma.referral.update({
                where: { id: referral.id },
                data: {
                    loginCount: newLoginCount,
                    isActive: true,
                    passiveEndsAt
                }
            });

            totalPointsToAdd += bonusGem; // Child gets bonus
            
            await prisma.user.upsert({
                where: { guildId_discordId: { guildId: bonusButton.guildId, discordId: referral.parentId } },
                update: { points: { increment: bonusGem } },
                create: { guildId: bonusButton.guildId, discordId: referral.parentId, points: bonusGem }
            });

            referralBonusMessage = `\n\n🎉 **リファラルタスク完了！**\n招待してくれた <@${referral.parentId}> さんとの間に **確定ボーナス ${bonusGem} ${currencyName}** がそれぞれに付与され、今日から${passiveDays}日間の **パッシブEXP/GEM還元** がスタートしました！`;
                
            // Locally update to trigger passive GEM immediately
            referral.isActive = true;
            referral.passiveEndsAt = passiveEndsAt;
        } else {
            await prisma.referral.update({
                where: { id: referral.id },
                data: { loginCount: newLoginCount }
            });
            referralBonusMessage = `\n\n🤝 **友達招待タスク進行中: ${newLoginCount} / ${requiredLogins}**\nあと${requiredLogins - newLoginCount}回ログインすると、あなたと招待者に確定ボーナスとパッシブ還元が付与されます！`;
        }
    }

    await prisma.$transaction([
        prisma.user.update({
            where: {
                guildId_discordId: {
                    guildId: bonusButton.guildId,
                    discordId: interaction.user.id,
                }
            },
            data: { 
                points: { increment: totalPointsToAdd },
                lastLoginAt: now,
                streakCount: newStreakCount,
                totalLogins: newTotalLogins
            }
        }),
        prisma.bonusClaim.create({
            data: {
                guildId: bonusButton.guildId,
                buttonId: bonusButton.id,
                discordId: interaction.user.id,
                claimedAt: now
            }
        })
    ]);

    let responseContent = `💡 <@${interaction.user.id}>さん、**${newStreakCount}日連続**ログインです！全部で**${newTotalLogins}日**ログインしています！\n\n🎁 本日のログインボーナス: **${reward} ${currencyName}**`;

    if (bonusMessage !== '') {
        responseContent += `\n\n🎉 **${newStreakCount}日継続ボーナスを獲得しました！**\n追加報酬:${bonusMessage}`;
    }

    if (referralBonusMessage !== '') {
        responseContent += referralBonusMessage;
    }

    if (referral && referral.isActive && referral.passiveEndsAt && referral.passiveEndsAt > now) {
        const passiveRate = dbGuildConfig?.referralPassiveRate ?? 10;
        if (passiveRate > 0) {
            const baseBonusGem = reward + (streakConfig?.bonusGem ?? 0);
            const parentPassiveGem = Math.floor(baseBonusGem * (passiveRate / 100));
            if (parentPassiveGem > 0) {
                await prisma.user.upsert({
                    where: { guildId_discordId: { guildId: bonusButton.guildId, discordId: referral.parentId } },
                    update: { points: { increment: parentPassiveGem } },
                    create: { guildId: bonusButton.guildId, discordId: referral.parentId, points: parentPassiveGem }
                });
            }
        }
    }

    await interaction.editReply({ content: responseContent });
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

    // Passive GEM for the winner
    const now = new Date();
    const winnerReferral = await prisma.referral.findUnique({
        where: { guildId_childId: { guildId: bonusButton.guildId, childId: randomMemberId } }
    });

    if (winnerReferral && winnerReferral.isActive && winnerReferral.passiveEndsAt && winnerReferral.passiveEndsAt > now) {
        const guildConfig = await prisma.guildConfig.findUnique({ where: { guildId: bonusButton.guildId } });
        const passiveRate = guildConfig?.referralPassiveRate ?? 10;
        if (passiveRate > 0) {
            const parentPassiveGem = Math.floor(reward * (passiveRate / 100));
            if (parentPassiveGem > 0) {
                await prisma.user.upsert({
                    where: { guildId_discordId: { guildId: bonusButton.guildId, discordId: winnerReferral.parentId } },
                    update: { points: { increment: parentPassiveGem } },
                    create: { guildId: bonusButton.guildId, discordId: winnerReferral.parentId, points: parentPassiveGem }
                });
            }
        }
    }

    await interaction.editReply({
        content: `🎲 <@${interaction.user.id}> さんが **${bonusButton.cost} ${currencyName}** を消費してルーレットを回しました！\n\n🎉 <@${randomMemberId}> さんに **${reward} ${currencyName}** を付与！おめでとうございます！！\n<@${interaction.user.id}> さんにお礼を一言伝えましょうね`
    });
}
