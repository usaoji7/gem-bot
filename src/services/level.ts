import { GuildMember } from 'discord.js';
import { prisma } from '../prisma.js';
import { LEVEL_CONSTANTS, getLevelInfo } from '../constants/level.js';

/**
 * ユーザーのアクションに対してEXPを付与し、必要に応じてレベルアップ処理を行う
 * 
 * @param member 発言などのアクションを行ったメンバー
 * @param actionType 'TEXT' | 'REACTION' | 'LOGIN' | 'ROULETTE'
 * @param targetId リアクション先のメッセージIDなど（重複チェック用）
 * @returns 獲得したEXPとレベルアップ情報
 */
export async function addExp(
  member: GuildMember,
  actionType: 'TEXT' | 'REACTION' | 'LOGIN' | 'ROULETTE',
  targetId?: string
) {
  const guildId = member.guild.id;
  const discordId = member.id;

  // 1. スパム対策・上限チェック
  if (actionType === 'TEXT' || actionType === 'REACTION') {
    const isSpam = await checkSpam(guildId, discordId, actionType, targetId);
    if (isSpam) {
      return { addedExp: 0, levelUp: false, reason: 'SPAM_OR_LIMIT_REACHED' };
    }
  }

  // 2. ベースEXPの取得
  let baseExp = 0;
  if (actionType === 'TEXT') baseExp = LEVEL_CONSTANTS.EXP.TEXT;
  else if (actionType === 'REACTION') baseExp = LEVEL_CONSTANTS.EXP.REACTION;
  else if (actionType === 'LOGIN') baseExp = LEVEL_CONSTANTS.EXP.LOGIN;
  else if (actionType === 'ROULETTE') baseExp = LEVEL_CONSTANTS.EXP.ROULETTE;

  if (baseExp === 0) return { addedExp: 0, levelUp: false, reason: 'INVALID_ACTION' };

  // 3. 乗算バフの計算
  const multiplier = await calculateMultiplier(member);
  
  // 4. 最終獲得EXP（切り捨て）
  const finalExp = Math.floor(baseExp * multiplier);

  // 5. DBの更新（ユーザー情報とログ）
  let user = await prisma.user.findUnique({
    where: { guildId_discordId: { guildId, discordId } }
  });

  if (!user) {
    user = await prisma.user.create({
      data: { guildId, discordId }
    });
  }

  const newTotalExp = user.totalExp + finalExp;
  const newSeasonExp = user.currentSeasonExp + finalExp;

  const currentLevelInfo = getLevelInfo(user.totalExp);
  const newLevelInfo = getLevelInfo(newTotalExp);
  
  const levelUp = newLevelInfo.level > currentLevelInfo.level;

  await prisma.user.update({
    where: { guildId_discordId: { guildId, discordId } },
    data: {
      totalExp: newTotalExp,
      currentSeasonExp: newSeasonExp,
      level: newLevelInfo.level
    }
  });

  // ログ記録（TEXTとREACTIONのみ）
  if (actionType === 'TEXT' || actionType === 'REACTION') {
    await prisma.actionLog.create({
      data: {
        guildId,
        discordId,
        actionType,
        targetId: targetId || null
      }
    });
  }

  // 6. Referral Passive EXP
  if (finalExp > 0) {
      const referral = await prisma.referral.findUnique({
          where: { guildId_childId: { guildId, childId: discordId } }
      });
      if (referral && referral.isActive && referral.passiveEndsAt && referral.passiveEndsAt > new Date()) {
          const guildConfigInfo = await prisma.guildConfig.findUnique({ where: { guildId } });
          const passiveRate = guildConfigInfo?.referralPassiveRate ?? 10;
          if (passiveRate > 0) {
              const passiveExp = Math.floor(finalExp * (passiveRate / 100));
              if (passiveExp > 0) {
                  const parentUser = await prisma.user.findUnique({
                      where: { guildId_discordId: { guildId, discordId: referral.parentId } }
                  });
                  if (parentUser) {
                      const parentNewTotal = parentUser.totalExp + passiveExp;
                      const parentNewSeason = parentUser.currentSeasonExp + passiveExp;
                      const parentNewLevelInfo = getLevelInfo(parentNewTotal);
                      
                      await prisma.user.update({
                          where: { id: parentUser.id },
                          data: {
                              totalExp: parentNewTotal,
                              currentSeasonExp: parentNewSeason,
                              level: parentNewLevelInfo.level
                          }
                      });
                  }
              }
          }
      }
  }

  return { addedExp: finalExp, levelUp, newLevel: newLevelInfo.level, multiplier };
}

/**
 * ユーザーの所持ロールからEXP乗算バフを計算する
 */
export async function calculateMultiplier(member: GuildMember): Promise<number> {
  const guildId = member.guild.id;
  const roleIds = Array.from(member.roles.cache.keys());

  if (roleIds.length === 0) return 1.0;

  // このサーバーのバフ設定を取得
  const [streakConfigs, privilegeRoles] = await Promise.all([
    prisma.streakConfig.findMany({ where: { guildId } }),
    prisma.guildRoleMultiplier.findMany({ where: { guildId } })
  ]);

  let maxStreakMultiplier = 1.0;
  let maxPrivilegeMultiplier = 1.0;

  // StreakHeroバフの最大値
  for (const config of streakConfigs) {
    if (config.roleId && roleIds.includes(config.roleId) && config.multiplier) {
      if (config.multiplier > maxStreakMultiplier) {
        maxStreakMultiplier = config.multiplier;
      }
    }
  }

  // 特権ロールバフの最大値
  for (const privRole of privilegeRoles) {
    if (roleIds.includes(privRole.roleId)) {
      if (privRole.multiplier > maxPrivilegeMultiplier) {
        maxPrivilegeMultiplier = privRole.multiplier;
      }
    }
  }

  return maxStreakMultiplier * maxPrivilegeMultiplier;
}

/**
 * スパム・回数上限のチェック
 * @returns true: スパムまたは上限到達（EXP付与しない）, false: 正常
 */
async function checkSpam(guildId: string, discordId: string, actionType: 'TEXT' | 'REACTION', targetId?: string): Promise<boolean> {
  const guildConfig = await prisma.guildConfig.findUnique({ where: { guildId } });
  const textLimit = guildConfig?.textExpLimit ?? 5;
  const reactionLimit = guildConfig?.reactionExpLimit ?? 5;

  const limit = actionType === 'TEXT' ? textLimit : reactionLimit;

  // 1日（今日の0時以降）のログを取得
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const logsToday = await prisma.actionLog.findMany({
    where: {
      guildId,
      discordId,
      actionType,
      createdAt: { gte: todayStart }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (logsToday.length >= limit) {
    return true; // 回数上限到達
  }

  if (actionType === 'TEXT') {
    // 1分間のクールダウンチェック
    if (logsToday.length > 0) {
      const lastLog = logsToday[0];
      const now = new Date();
      if (lastLog && now.getTime() - lastLog.createdAt.getTime() < LEVEL_CONSTANTS.LIMITS.TEXT_COOLDOWN_MS) {
        return true; // クールダウン中
      }
    }
  } else if (actionType === 'REACTION' && targetId) {
    // 同一メッセージへの重複リアクションチェック（全期間）
    const duplicateReaction = await prisma.actionLog.findFirst({
      where: {
        guildId,
        discordId,
        actionType: 'REACTION',
        targetId
      }
    });
    if (duplicateReaction) {
      return true; // すでにEXP獲得済みのメッセージ
    }
  }

  return false;
}
