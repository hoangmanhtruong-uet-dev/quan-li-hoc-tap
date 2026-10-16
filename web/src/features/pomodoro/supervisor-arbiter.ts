export type RoastLevel = 'light' | 'medium' | 'extreme';
export type ViolationType = 'tab_switch' | 'idle' | 'face_away' | 'sleep';

export interface SupervisorState {
  lastRoastTimestamp: number;
  roastCount: number;
  exemptUntil: number; // Thời điểm hết hạn miễn trừ (nút Tôi đang tra tài liệu)
}

/**
 * Thuật toán phân xử của Supervisor (Chống mắng dồn dập, quản lý cooldown và leo thang trừng phạt)
 */
export class SupervisorArbiter {
  private cooldownMs: number;
  private state: SupervisorState;

  constructor(cooldownSeconds: number = 20) {
    this.cooldownMs = cooldownSeconds * 1000;
    this.state = {
      lastRoastTimestamp: 0,
      roastCount: 0,
      exemptUntil: 0,
    };
  }

  /**
   * Kích hoạt miễn trừ tạm thời (ví dụ người dùng bấm "Tôi đang tra tài liệu" 2 phút)
   */
  public requestExemption(durationSeconds: number = 120) {
    this.state.exemptUntil = Date.now() + durationSeconds * 1000;
  }

  public isExempt(): boolean {
    return Date.now() < this.state.exemptUntil;
  }

  public getRemainingExemptionSeconds(): number {
    const rem = Math.max(0, Math.round((this.state.exemptUntil - Date.now()) / 1000));
    return rem;
  }

  /**
   * Quyết định xem có được mắng không dựa vào cooldown và thời gian miễn trừ
   */
  public canRoast(): boolean {
    if (this.isExempt()) return false;
    const now = Date.now();
    return now - this.state.lastRoastTimestamp >= this.cooldownMs;
  }

  /**
   * Ghi nhận 1 lần mắng và tính toán cấp độ phản ứng tiếp theo
   */
  public registerRoast(): { roastCount: number; currentRoastSeverity: 'warning' | 'penalty' } {
    this.state.lastRoastTimestamp = Date.now();
    this.state.roastCount += 1;
    return {
      roastCount: this.state.roastCount,
      currentRoastSeverity: this.state.roastCount > 2 ? 'penalty' : 'warning',
    };
  }

  /**
   * Tính điểm kỷ luật (Discipline Score) từ 0 -> 100
   */
  public calculateDisciplineScore(actualFocusMinutes: number, targetMinutes: number): number {
    if (targetMinutes <= 0) return 100;
    const completionRate = Math.min(1, actualFocusMinutes / targetMinutes);
    // Mỗi lần bị mắng trừ 5 điểm kỷ luật
    const penalty = this.state.roastCount * 5;
    const baseScore = Math.round(completionRate * 100);
    return Math.max(0, Math.min(100, baseScore - penalty));
  }

  public reset() {
    this.state = {
      lastRoastTimestamp: 0,
      roastCount: 0,
      exemptUntil: 0,
    };
  }
}
