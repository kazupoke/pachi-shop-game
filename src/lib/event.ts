/**
 * 店舗イベント
 *
 * - calendar: カレンダー由来 (日付ベースで自動付与) — コスト 0
 * - special:  店長が選んで発動するスペシャルイベント — コスト消費 + 客付き UP
 *
 * 1 営業日 (4 リアル時間) のあいだ持続する。
 */

export type EventKind = "calendar" | "special";

export interface CalendarEvent {
  /** 表示名 */
  name: string;
  /** 1 行説明 */
  desc: string;
  /** 客付き倍率 */
  attractMul: number;
  /** 看板絵文字 */
  emoji: string;
  /** 色 (Tailwind class) */
  color: string;
}

export interface SpecialEvent {
  id: string;
  name: string;
  desc: string;
  /** 価格 (G) */
  cost: number;
  /** 客付き倍率 */
  attractMul: number;
  /** 機械割上振れ (% pt) — 0 でなし、+0.5 など */
  payoutBonus: number;
  emoji: string;
  color: string;
}

export const SPECIAL_EVENTS: SpecialEvent[] = [
  {
    id: "leaflet",
    name: "チラシ折込",
    desc: "新聞折込で集客 +25%",
    cost: 200_000,
    attractMul: 1.25,
    payoutBonus: 0,
    emoji: "📰",
    color: "text-pachi-cyan",
  },
  {
    id: "high_setting_appeal",
    name: "高設定示唆",
    desc: "全台 +30% 集客 (機械割も少し上振れ)",
    cost: 800_000,
    attractMul: 1.3,
    payoutBonus: 0.4,
    emoji: "🔥",
    color: "text-pachi-yellow",
  },
  {
    id: "all_six_day",
    name: "全6デー",
    desc: "全台高設定示唆 +50% 集客 / 大幅マイナス",
    cost: 2_500_000,
    attractMul: 1.5,
    payoutBonus: 1.5,
    emoji: "🎰",
    color: "text-pachi-red",
  },
  {
    id: "free_drink",
    name: "ドリンク無料",
    desc: "+15% 集客 / 滞在時間アップ",
    cost: 80_000,
    attractMul: 1.15,
    payoutBonus: 0,
    emoji: "🥤",
    color: "text-pachi-green",
  },
  {
    id: "anniversary",
    name: "周年祭",
    desc: "看板演出と粗品配布 +40% 集客",
    cost: 1_500_000,
    attractMul: 1.4,
    payoutBonus: 0.8,
    emoji: "🎉",
    color: "text-pachi-pink",
  },
];

export const SPECIAL_EVENTS_BY_ID: Record<string, SpecialEvent> = SPECIAL_EVENTS.reduce(
  (acc, e) => {
    acc[e.id] = e;
    return acc;
  },
  {} as Record<string, SpecialEvent>
);

/** 指定日のカレンダーイベントを返す (なければ null) */
export function calendarEventOf(date: Date): CalendarEvent | null {
  const day = date.getDate();
  const dStr = String(day);
  // 1 日 (月初)
  if (day === 1) {
    return {
      name: "月初イベント",
      desc: "毎月 1 日は集客 ×1.10",
      attractMul: 1.1,
      emoji: "🌙",
      color: "text-pachi-cyan",
    };
  }
  // 末尾 0 (10/20/30)
  if (dStr.endsWith("0")) {
    return {
      name: "末尾0デー",
      desc: "末尾 0 の日は集客 ×1.15",
      attractMul: 1.15,
      emoji: "🅾️",
      color: "text-pachi-yellow",
    };
  }
  // ジャグラーの日 (5 のつく日)
  if (dStr.endsWith("5")) {
    return {
      name: "ジャグラーの日",
      desc: "5 のつく日 集客 ×1.10 (Aタイプ偏重)",
      attractMul: 1.1,
      emoji: "🎲",
      color: "text-pachi-yellow",
    };
  }
  // 6/7/8 のつく日 (有名な並びイベント)
  if (dStr.endsWith("6") || dStr.endsWith("7") || dStr.endsWith("8")) {
    return {
      name: `${dStr.slice(-1)}のつく日`,
      desc: "並びイベント 集客 ×1.20",
      attractMul: 1.2,
      emoji: "✨",
      color: "text-pachi-pink",
    };
  }
  return null;
}

export interface ActiveEvent {
  /** スペシャルイベントの id (店長が選んだもの) */
  specialId: string | null;
  /** 適用されている日付 (YYYY-MM-DD) */
  appliedDate: string;
}
