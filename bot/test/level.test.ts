import { describe, it, expect, vi } from 'vitest';
import { addExp } from '../src/services/level.js';
import { prismaMock } from './prisma.mock.js';
import { LEVEL_CONSTANTS } from '../src/constants/level.js';

describe('Level Service', () => {
  it('スパム（1日のテキスト上限5回）に達した場合はEXPが0になる', async () => {
    // スパム判定がTrueになるように、今日のログを5件返すようにモック
    prismaMock.actionLog.findMany.mockResolvedValue([
      { id: 1, guildId: 'g1', discordId: 'u1', actionType: 'TEXT', targetId: null, createdAt: new Date() },
      { id: 2, guildId: 'g1', discordId: 'u1', actionType: 'TEXT', targetId: null, createdAt: new Date() },
      { id: 3, guildId: 'g1', discordId: 'u1', actionType: 'TEXT', targetId: null, createdAt: new Date() },
      { id: 4, guildId: 'g1', discordId: 'u1', actionType: 'TEXT', targetId: null, createdAt: new Date() },
      { id: 5, guildId: 'g1', discordId: 'u1', actionType: 'TEXT', targetId: null, createdAt: new Date() },
    ]);
    prismaMock.guildConfig.findUnique.mockResolvedValue(null);

    // モックのメンバーオブジェクト
    const mockMember = {
      id: 'u1',
      guild: { id: 'g1' },
      roles: { cache: new Map() }
    } as any;

    const result = await addExp(mockMember, 'TEXT');
    expect(result.addedExp).toBe(0);
    expect(result.reason).toBe('SPAM_OR_LIMIT_REACHED');
  });

  it('正常なTEXT発言の場合は基礎EXPを獲得し、ユーザーのEXPが保存される', async () => {
    // スパム判定を通過させる（ログ0件）
    prismaMock.actionLog.findMany.mockResolvedValue([]);
    prismaMock.guildConfig.findUnique.mockResolvedValue(null);
    prismaMock.streakConfig.findMany.mockResolvedValue([]);
    prismaMock.guildRoleMultiplier.findMany.mockResolvedValue([]);

    // DBにユーザーが存在する前提
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      guildId: 'g1',
      discordId: 'u1',
      points: 0,
      level: 1,
      currentSeasonExp: 0,
      totalExp: 0,
      isAdmin: false,
      lastLoginAt: null,
      streakCount: 0,
      totalLogins: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const mockMember = {
      id: 'u1',
      guild: { id: 'g1' },
      roles: { cache: new Map() }
    } as any;

    const result = await addExp(mockMember, 'TEXT');
    
    expect(result.addedExp).toBe(LEVEL_CONSTANTS.EXP.TEXT);
    expect(result.levelUp).toBe(false);

    // prisma.user.update が正しく呼ばれたか検証
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { guildId_discordId: { guildId: 'g1', discordId: 'u1' } },
        data: expect.objectContaining({
          totalExp: LEVEL_CONSTANTS.EXP.TEXT
        })
      })
    );
  });
});
