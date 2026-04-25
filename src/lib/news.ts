/**
 * 業界ニュース
 *
 * 自店の出来事 + ランダムな業界ニュース テンプレを混ぜて表示する。
 * 最大 8 件保持。
 */

import { ALL_MACHINES } from "../data/machines";

export interface NewsItem {
  id: string;
  /** 種別 (色分け用) */
  kind: "industry" | "shop" | "event" | "rumor";
  text: string;
  /** ISO 日時 */
  at: string;
}

const INDUSTRY_TEMPLATES = [
  (m: string) => `新台「${m}」掲示板アクセス急増中`,
  (m: string) => `「${m}」設定6判別ロジック解析掲示板で公開`,
  (m: string) => `「${m}」打感アンケート、好感度 92%`,
  () => `全国店舗で 6 のつく日イベント、過去最大規模`,
  () => `市場流通量、年初比 -18%`,
  (m: string) => `${m} のホール導入加速、需給逼迫`,
  () => `業界紙: 来月のイベント候補日が議論に`,
  (m: string) => `${m}、上振れ報告がX(旧Twitter)で拡散`,
  () => `スマスロ規制緩和の噂、業界がざわつく`,
  () => `全国ホールの平均稼働、わずかに回復`,
];

const SHOP_TEMPLATES_REVENUE = [
  (n: number) => `本日の来店 ${n.toLocaleString()} 名突破`,
  (n: number) => `累計 ${n.toLocaleString()} 名 達成、店長感涙`,
];

const SHOP_TEMPLATES_GOOD = [
  () => `常連レベル平均上昇中`,
  () => `閉店作業の手際、店長レベル向上`,
];

const SHOP_TEMPLATES_BAD = [
  () => `故障台が多発…客足に影響`,
  () => `低設定が続く店、SNSで噂に`,
];

const RUMOR_TEMPLATES = [
  () => `近隣店舗で大型イベント計画中の噂`,
  () => `県境のホール、新装オープンで集客争奪`,
  () => `あの伝説のライター、近々の来店スケジュール調整中`,
];

export function genIndustryNews(now = new Date()): NewsItem {
  const m = ALL_MACHINES[Math.floor(Math.random() * ALL_MACHINES.length)];
  const tpl = INDUSTRY_TEMPLATES[Math.floor(Math.random() * INDUSTRY_TEMPLATES.length)];
  return {
    id: `n${now.getTime()}-${Math.floor(Math.random() * 9999)}`,
    kind: "industry",
    text: tpl(m?.name ?? "新台"),
    at: now.toISOString(),
  };
}

export function genShopNews(opts: {
  totalCustomers: number;
  brokenCount: number;
  avgSetting: number;
  now?: Date;
}): NewsItem | null {
  const now = opts.now ?? new Date();
  const r = Math.random();
  let text: string | null = null;
  if (opts.brokenCount >= 3 && r < 0.4) {
    text = SHOP_TEMPLATES_BAD[Math.floor(Math.random() * SHOP_TEMPLATES_BAD.length)]();
  } else if (opts.avgSetting <= 1.5 && r < 0.4) {
    text = SHOP_TEMPLATES_BAD[Math.floor(Math.random() * SHOP_TEMPLATES_BAD.length)]();
  } else if (opts.totalCustomers > 0 && r < 0.4) {
    const tpl = SHOP_TEMPLATES_REVENUE[Math.floor(Math.random() * SHOP_TEMPLATES_REVENUE.length)];
    text = tpl(opts.totalCustomers);
  } else if (opts.avgSetting >= 4 && r < 0.4) {
    text = SHOP_TEMPLATES_GOOD[Math.floor(Math.random() * SHOP_TEMPLATES_GOOD.length)]();
  }
  if (!text) return null;
  return {
    id: `s${now.getTime()}-${Math.floor(Math.random() * 9999)}`,
    kind: "shop",
    text,
    at: now.toISOString(),
  };
}

export function genRumorNews(now = new Date()): NewsItem {
  const tpl = RUMOR_TEMPLATES[Math.floor(Math.random() * RUMOR_TEMPLATES.length)];
  return {
    id: `r${now.getTime()}-${Math.floor(Math.random() * 9999)}`,
    kind: "rumor",
    text: tpl(),
    at: now.toISOString(),
  };
}

export function genEventNews(text: string, now = new Date()): NewsItem {
  return {
    id: `e${now.getTime()}-${Math.floor(Math.random() * 9999)}`,
    kind: "event",
    text,
    at: now.toISOString(),
  };
}
