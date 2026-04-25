/**
 * 経営 (家計簿) システム
 *
 * 1 ゲーム月 = 30 営業日 = 30 × 4h = 120 リアル時間 = 432_000 秒
 * 月の経費 (家賃・電気・人件費) は時間按分で tick ごとに発生する
 */

export const REAL_HOURS_PER_BIZ_DAY = 4;
export const BIZ_DAYS_PER_MONTH = 30;
export const REAL_HOURS_PER_MONTH = REAL_HOURS_PER_BIZ_DAY * BIZ_DAYS_PER_MONTH;
export const REAL_SEC_PER_MONTH = REAL_HOURS_PER_MONTH * 3600;
export const REAL_SEC_PER_BIZ_DAY = REAL_HOURS_PER_BIZ_DAY * 3600;

/** 月固定費 */
export const MONTHLY_RENT = 1_500_000;
export const MONTHLY_ELECTRIC = 800_000;
export const MONTHLY_LABOR = 2_400_000;
export const MONTHLY_FIXED_TOTAL =
  MONTHLY_RENT + MONTHLY_ELECTRIC + MONTHLY_LABOR;

export interface MonthlyStats {
  /** 月開始時刻 (ISO) */
  startedAt: string;
  /** 0.0 - 30.0 (進行度: 営業日換算) */
  bizDayProgress: number;
  /** 月内の累計売上 */
  revenue: number;
  /** 月内の累計来店数 */
  customers: number;
  /** 経費内訳 */
  rent: number;
  electric: number;
  labor: number;
  /** 修繕費 (部品購入 + 修理コスト) */
  repair: number;
  /** イベント費 (今日のイベント / 演者) */
  event: number;
  /** 設備投資 (拡張 + 看板購入) */
  equipment: number;
  /** 倉庫保管費 (在庫 1 台 ¥200/日) */
  storage: number;
}

export function emptyMonthlyStats(now = new Date()): MonthlyStats {
  return {
    startedAt: now.toISOString(),
    bizDayProgress: 0,
    revenue: 0,
    customers: 0,
    rent: 0,
    electric: 0,
    labor: 0,
    repair: 0,
    event: 0,
    equipment: 0,
    storage: 0,
  };
}

/** 月の総支出 */
export function totalExpense(s: MonthlyStats): number {
  return (
    s.rent +
    s.electric +
    s.labor +
    s.repair +
    s.event +
    s.equipment +
    s.storage
  );
}

/** 月の利益 */
export function monthProfit(s: MonthlyStats): number {
  return s.revenue - totalExpense(s);
}
