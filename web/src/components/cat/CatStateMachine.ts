import type { CatActionState } from './CatRig';
import type { RoastLevel } from '@/features/pomodoro/supervisor-arbiter';

export interface PomodoroCatContext {
  running: boolean;
  focusMode: 'extreme_cat' | 'chill_breathing';
  isSpeaking: boolean;
  isAwayTab: boolean;
  shameCount: number;
  roastLevel: RoastLevel;
  isSessionFinished: boolean;
  isPoked: boolean;
}

export function determineCatState(ctx: PomodoroCatContext): CatActionState {
  if (ctx.isPoked) {
    return 'poked';
  }

  if (ctx.isSessionFinished) {
    return 'celebrating';
  }

  if (ctx.focusMode === 'chill_breathing') {
    return 'break';
  }

  if (ctx.isAwayTab) {
    if (ctx.isSpeaking) {
      if (ctx.roastLevel === 'extreme' || ctx.shameCount > 2) {
        return 'scolding_extreme';
      }
      if (ctx.roastLevel === 'medium') {
        return 'scolding_medium';
      }
      return 'scolding_light';
    }
    return 'warning';
  }

  if (ctx.running) {
    if (ctx.isSpeaking) {
      return ctx.roastLevel === 'extreme' ? 'scolding_medium' : 'warning';
    }
    return 'focusing';
  }

  return 'idle';
}
