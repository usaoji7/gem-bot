import { describe, it, expect } from 'vitest';
import { getLevelInfo } from '../src/constants/level.js';

describe('Level Constants', () => {
  describe('getLevelInfo', () => {
    it('EXPが0の時はレベル1を返す', () => {
      const info = getLevelInfo(0);
      expect(info.level).toBe(1);
      expect(info.gemMultiplier).toBe(1.0);
    });

    it('EXPが499の時はレベル1を返す', () => {
      const info = getLevelInfo(499);
      expect(info.level).toBe(1);
    });

    it('EXPが500の時はレベル2を返す', () => {
      const info = getLevelInfo(500);
      expect(info.level).toBe(2);
      expect(info.gemMultiplier).toBe(1.1);
    });

    it('EXPが35000以上の時は最大レベル(10)を返す', () => {
      const info = getLevelInfo(40000);
      expect(info.level).toBe(10);
      expect(info.gemMultiplier).toBe(2.0);
    });
  });
});
