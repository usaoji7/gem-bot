export const LEVEL_CONSTANTS = {
  EXP: {
    TEXT: 10,
    LOGIN: 50,
    ROULETTE: 50,
    REACTION: 2,
  },
  LIMITS: {
    TEXT_MIN_LENGTH: 5,
    TEXT_MAX_LENGTH: 300,
    TEXT_COOLDOWN_MS: 60 * 1000, // 1分
  },
  // GEMレベルに必要な累積EXPと、到達時のGEM獲得倍率
  // インデックスがレベル（0始まりなので +1 がレベル）
  LEVEL_THRESHOLDS: [
    { level: 1, requiredExp: 0, gemMultiplier: 1.0 },
    { level: 2, requiredExp: 500, gemMultiplier: 1.1 },
    { level: 3, requiredExp: 1500, gemMultiplier: 1.2 },
    { level: 4, requiredExp: 3500, gemMultiplier: 1.3 },
    { level: 5, requiredExp: 7000, gemMultiplier: 1.4 },
    { level: 6, requiredExp: 12000, gemMultiplier: 1.5 },
    { level: 7, requiredExp: 18000, gemMultiplier: 1.6 },
    { level: 8, requiredExp: 24000, gemMultiplier: 1.7 },
    { level: 9, requiredExp: 30000, gemMultiplier: 1.8 },
    { level: 10, requiredExp: 35000, gemMultiplier: 2.0 },
  ],
  SEASON: {
    DURATION_MONTHS: 3,
    AWARDS: [
      { roleName: 'Season Platinum', expBonus: 1500, rankPercentage: 1 },
      { roleName: 'Season Gold', expBonus: 1000, rankPercentage: 5 },
      { roleName: 'Season Silver', expBonus: 500, rankPercentage: 10 },
      { roleName: 'Season Bronze', expBonus: 100, rankPercentage: 15 },
    ]
  }
};

/**
 * 現在の累積EXPからレベル情報を取得するヘルパー関数
 */
export function getLevelInfo(totalExp: number) {
  // 後ろから検索して、条件を満たす最大のレベルを返す
  for (let i = LEVEL_CONSTANTS.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = LEVEL_CONSTANTS.LEVEL_THRESHOLDS[i];
    if (threshold && totalExp >= threshold.requiredExp) {
      return threshold;
    }
  }
  return LEVEL_CONSTANTS.LEVEL_THRESHOLDS[0]!;
}
