/**
 * 来店演者
 *
 * 1 営業日に 1 人だけ呼べる。コスト消費 + 当日の客付き UP。
 * 親和カテゴリの常連を優先的に増やす。
 */

import type { CustomerCategory } from "./customer";

export interface Performer {
  id: string;
  name: string;
  title: string;
  /** 価格 (G) */
  cost: number;
  /** 客付き倍率 */
  attractMul: number;
  /** 親和カテゴリ (ある場合は該当カテゴリ常連が増えやすい) */
  affinity: CustomerCategory | null;
  /** ライターか YouTuber か */
  kind: "writer" | "youtuber" | "idol" | "maker";
  emoji: string;
  color: string;
  desc: string;
}

export const PERFORMERS: Performer[] = [
  {
    id: "kkn",
    name: "コーキ＝ナイン",
    title: "新人ライター",
    cost: 80_000,
    attractMul: 1.08,
    affinity: "newbie",
    kind: "writer",
    emoji: "📝",
    color: "text-pachi-green",
    desc: "若手ライター。SNS で軽くバズる",
  },
  {
    id: "mocchan",
    name: "もっちゃん",
    title: "中堅ライター",
    cost: 200_000,
    attractMul: 1.18,
    affinity: "a_type",
    kind: "writer",
    emoji: "✏️",
    color: "text-pachi-yellow",
    desc: "Aタイプ好き。固定ファン多数",
  },
  {
    id: "akari",
    name: "あかりっぺ",
    title: "アイドルライター",
    cost: 350_000,
    attractMul: 1.25,
    affinity: "moe",
    kind: "idol",
    emoji: "💖",
    color: "text-pachi-pink",
    desc: "萌えスロ専門。常連化率 UP",
  },
  {
    id: "king",
    name: "キング",
    title: "実戦系YouTuber",
    cost: 500_000,
    attractMul: 1.32,
    affinity: "high_volatility",
    kind: "youtuber",
    emoji: "👑",
    color: "text-pachi-red",
    desc: "凱旋系の伝説。射幸性ガチ勢が殺到",
  },
  {
    id: "anime_lord",
    name: "総帥アニメカ",
    title: "版権ガチ勢",
    cost: 280_000,
    attractMul: 1.22,
    affinity: "anime",
    kind: "youtuber",
    emoji: "🎌",
    color: "text-pachi-cyan",
    desc: "北斗・エヴァに反応するアニメ層を呼ぶ",
  },
  {
    id: "veteran_master",
    name: "硬派の御大",
    title: "4号機マスター",
    cost: 180_000,
    attractMul: 1.15,
    affinity: "veteran",
    kind: "writer",
    emoji: "🎖️",
    color: "text-white",
    desc: "硬派ベテラン層に絶大な人気",
  },
  {
    id: "maker_rep",
    name: "メーカー社員",
    title: "メーカー直送",
    cost: 600_000,
    attractMul: 1.4,
    affinity: null,
    kind: "maker",
    emoji: "🏭",
    color: "text-pachi-purple",
    desc: "新台直送イベント。集客大幅UP",
  },
];

export const PERFORMERS_BY_ID: Record<string, Performer> = PERFORMERS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, Performer>
);

export interface ActivePerformer {
  performerId: string;
  appliedDate: string;
}
