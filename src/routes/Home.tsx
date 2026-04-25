import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../stores/useGameStore";
import { MachineThumb } from "../components/MachineThumb";
import { MACHINES_BY_ID } from "../data/machines";
import { BizHoursGauge } from "../components/BizHoursGauge";
import { calendarEventOf, SPECIAL_EVENTS_BY_ID } from "../lib/event";
import { PERFORMERS_BY_ID } from "../lib/performer";
import type { NewsItem } from "../lib/news";
import type { Rarity } from "../lib/types";

const RARITY_COLOR: Record<Rarity, string> = {
  N: "text-rarity-n",
  R: "text-rarity-r",
  SR: "text-rarity-sr",
  SSR: "text-rarity-ssr",
};

export function Home() {
  const navigate = useNavigate();
  const shop = useGameStore((s) => s.shop);
  const user = useGameStore((s) => s.user);
  const dreamMachines = useGameStore((s) => s.dreamMachines);
  const credentials = useGameStore((s) => s.credentials);
  const claimLoginBonus = useGameStore((s) => s.claimLoginBonus);
  const loginBonus = useGameStore((s) => s.loginBonus);
  const chodama = useGameStore((s) => s.chodama);
  const activeEvent = useGameStore((s) => s.activeEvent);
  const activePerformer = useGameStore((s) => s.activePerformer);
  const newsItems = useGameStore((s) => s.newsItems);
  const scheduledSettings = useGameStore((s) => s.scheduledSettings);
  const [bonusMsg, setBonusMsg] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const claimed = loginBonus.lastClaimDate === today;
  const isFirstVisit =
    !shop &&
    Object.keys(user?.ownedMachines ?? {}).length === 0 &&
    Object.keys(dreamMachines ?? {}).length === 0;

  useEffect(() => {
    if (isFirstVisit) navigate("/title", { replace: true });
  }, [isFirstVisit, navigate]);

  useEffect(() => {
    if (bonusMsg) {
      const t = setTimeout(() => setBonusMsg(null), 3200);
      return () => clearTimeout(t);
    }
  }, [bonusMsg]);

  const handleClaim = () => {
    const res = claimLoginBonus();
    if (res.claimed) {
      setBonusMsg(
        `店長出勤 +¥${res.amount.toLocaleString()} (${res.streak}日連続)`
      );
    }
  };

  // dreamMachines を上位 5 機種表示用に整理
  const dreamTop = useMemo(() => {
    const list = Object.entries(dreamMachines ?? {})
      .map(([id, count]) => ({ m: MACHINES_BY_ID[id], count }))
      .filter((x) => !!x.m)
      .sort((a, b) => {
        const r = { SSR: 4, SR: 3, R: 2, N: 1 } as Record<Rarity, number>;
        const dr = (r[b.m!.rarity] ?? 0) - (r[a.m!.rarity] ?? 0);
        if (dr !== 0) return dr;
        return b.count - a.count;
      })
      .slice(0, 5);
    return list;
  }, [dreamMachines]);

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {/* === 店舗の最新情報 === */}
      <section className="pixel-panel p-4 relative overflow-hidden">
        <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />
        <div className="relative">
          <p className="font-pixel text-[10px] text-pachi-cyan tracking-wider">
            ☆ 店舗の最新情報
          </p>
          <h1 className="mt-1 font-pixel text-base text-pachi-yellow">
            {shop?.name ?? "未開店"}
          </h1>
          <p className="text-[11px] text-white/60 mt-0.5">
            店長: {credentials?.managerName ?? "未登録"}
          </p>
        </div>
      </section>

      {/* 営業時間 + 出勤 */}
      <section className="grid grid-cols-1 gap-3">
        <BizHoursGauge />
        <div className="pixel-panel p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-pixel text-[10px] text-pachi-cyan">
              店長出勤ボーナス
            </p>
            <p className="text-[10px] text-white/60 mt-0.5">
              連続 {loginBonus.streak} 日 ·{" "}
              <span className={claimed ? "text-pachi-green" : "text-pachi-yellow"}>
                {claimed ? "受け取り済" : "未受取"}
              </span>
            </p>
          </div>
          <button
            onClick={handleClaim}
            disabled={claimed}
            className="pixel-btn text-[11px] py-2 px-3 disabled:opacity-30"
          >
            {claimed ? "明日また" : "出勤"}
          </button>
        </div>
        {bonusMsg && (
          <p className="text-center text-xs text-pachi-yellow animate-blink">
            {bonusMsg}
          </p>
        )}
      </section>

      {/* === 店長の推し (dream lineup) === */}
      {dreamTop.length > 0 && (
        <section className="pixel-panel p-3 border-2 border-pachi-pink">
          <div className="flex items-center justify-between mb-2">
            <p className="font-pixel text-[10px] text-pachi-pink">
              ★ 店長の推し ({dreamTop.length} / {Object.keys(dreamMachines).length})
            </p>
            <span className="text-[9px] text-white/50">理想店プロフィール</span>
          </div>
          <ul className="grid grid-cols-5 gap-1">
            {dreamTop.map(({ m, count }) =>
              m ? (
                <li key={m.id} className="text-center">
                  <div className="aspect-[2/3] bg-bg-base border border-bg-card overflow-hidden">
                    <MachineThumb
                      machineId={m.id}
                      name={m.name}
                      rarity={m.rarity}
                      size={48}
                      className="w-full h-full"
                    />
                  </div>
                  <p
                    className={`text-[9px] font-pixel mt-0.5 ${RARITY_COLOR[m.rarity]}`}
                  >
                    {m.rarity}×{count}
                  </p>
                </li>
              ) : null
            )}
          </ul>
          <p className="text-[10px] text-white/50 mt-2 leading-relaxed">
            {Object.values(dreamMachines).reduce((a, b) => a + b, 0)} 台 /{" "}
            {Object.keys(dreamMachines).length} 機種が目標。
            <br />
            ガチャで集めて、設置しよう。
          </p>
        </section>
      )}

      {/* === 今日の運営 (イベント / 演者 / 設定) === */}
      <section className="pixel-panel p-3">
        <p className="font-pixel text-[10px] text-pachi-yellow mb-2">
          今日の運営
        </p>
        <div className="grid grid-cols-1 gap-2">
          <TodayEventButton navigate={navigate} activeId={
            activeEvent && activeEvent.appliedDate === today
              ? activeEvent.specialId
              : null
          } />
          <TodayPerformerButton navigate={navigate} performerId={
            activePerformer && activePerformer.appliedDate === today
              ? activePerformer.performerId
              : null
          } />
          <TodayScheduleButton navigate={navigate} scheduledSettings={scheduledSettings} />
        </div>
      </section>

      {/* === 業界最新ニュース === */}
      <NewsSection newsItems={newsItems} />

      {/* === クイックアクセス === */}
      <section className="grid grid-cols-2 gap-2">
        <button
          onClick={() => navigate("/shop")}
          className="pixel-panel p-3 text-left"
        >
          <p className="font-pixel text-[11px] text-pachi-green">▶ 基本情報</p>
          <p className="text-[10px] text-white/60 mt-1">店舗俯瞰 / ダッシュボード</p>
        </button>
        <button
          onClick={() => navigate("/gacha")}
          className="pixel-panel p-3 text-left"
        >
          <p className="font-pixel text-[11px] text-pachi-pink">▶ 新台!!</p>
          <p className="text-[10px] text-white/60 mt-1">
            訪問プレイ · 貯玉 {chodama.toLocaleString()} 玉
          </p>
        </button>
        <button
          onClick={() => navigate("/collection")}
          className="pixel-panel p-3 text-left"
        >
          <p className="font-pixel text-[11px] text-pachi-yellow">▶ パチスロ</p>
          <p className="text-[10px] text-white/60 mt-1">機種一覧 · 設置中</p>
        </button>
        <button
          onClick={() => navigate("/market")}
          className="pixel-panel p-3 text-left"
        >
          <p className="font-pixel text-[11px] text-pachi-cyan">▶ 市場相場</p>
          <p className="text-[10px] text-white/60 mt-1">流通量 · 価格</p>
        </button>
      </section>
    </div>
  );
}

function TodayEventButton({
  navigate,
  activeId,
}: {
  navigate: ReturnType<typeof useNavigate>;
  activeId: string | null;
}) {
  const today = new Date();
  const cal = calendarEventOf(today);
  const ev = activeId ? SPECIAL_EVENTS_BY_ID[activeId] : null;
  let label = "📅 イベント日を選ぶ";
  let desc = "6・7・8 のつく日 / 末尾 0 / 月初など";
  if (ev) {
    label = `${ev.emoji} ${ev.name} 発動中`;
    desc = `集客 ×${ev.attractMul.toFixed(2)} ・ 機械割 +${ev.payoutBonus}%`;
  } else if (cal) {
    desc = `本日 ${cal.emoji} ${cal.name} (×${cal.attractMul.toFixed(2)})`;
  }
  return (
    <button
      onClick={() => navigate("/manager/event")}
      className={`bg-bg-base border-2 p-2 text-left ${
        ev ? "border-pachi-yellow" : "border-bg-card"
      }`}
    >
      <p className="text-[11px] text-white">{label}</p>
      <p className="text-[10px] text-white/60 mt-0.5">{desc}</p>
    </button>
  );
}

function TodayPerformerButton({
  navigate,
  performerId,
}: {
  navigate: ReturnType<typeof useNavigate>;
  performerId: string | null;
}) {
  const p = performerId ? PERFORMERS_BY_ID[performerId] : null;
  let label = "🎤 来店演者を呼ぶ";
  let desc = "ライター/YouTuber/メーカー社員 を呼ぶ";
  if (p) {
    label = `${p.emoji} ${p.name} 来店中`;
    desc = `${p.title} ・ 集客 ×${p.attractMul.toFixed(2)}`;
  }
  return (
    <button
      onClick={() => navigate("/manager/performer")}
      className={`bg-bg-base border-2 p-2 text-left ${
        p ? "border-pachi-pink" : "border-bg-card"
      }`}
    >
      <p className="text-[11px] text-white">{label}</p>
      <p className="text-[10px] text-white/60 mt-0.5">{desc}</p>
    </button>
  );
}

function TodayScheduleButton({
  navigate,
  scheduledSettings,
}: {
  navigate: ReturnType<typeof useNavigate>;
  scheduledSettings: Record<string, Record<string, number>>;
}) {
  // 明日 / 明後日 / 3 日後の予約数を集計
  const counts = [1, 2, 3].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const k = d.toISOString().slice(0, 10);
    return Object.keys(scheduledSettings[k] ?? {}).length;
  });
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <button
      onClick={() => navigate("/manager/schedule")}
      className={`bg-bg-base border-2 p-2 text-left ${
        total > 0 ? "border-pachi-cyan" : "border-bg-card"
      }`}
    >
      <p className="text-[11px] text-white">⚙️ 明日の設定を組む</p>
      <p className="text-[10px] text-white/60 mt-0.5">
        {total > 0
          ? `予約 ${total} 件 (明日${counts[0]} / 明後日${counts[1]} / 3日後${counts[2]})`
          : "3 日先まで自動設定スケジュール"}
      </p>
    </button>
  );
}

function NewsSection({ newsItems }: { newsItems: NewsItem[] }) {
  if (newsItems.length === 0) {
    return (
      <section className="pixel-panel p-3">
        <p className="font-pixel text-[10px] text-pachi-cyan mb-2">
          業界最新ニュース
        </p>
        <ul className="space-y-1 text-[11px] text-white/70 leading-relaxed">
          <li>・新台情報や業界動向はここに表示されます</li>
          <li>・営業を続けるとニュースが増えます</li>
        </ul>
      </section>
    );
  }
  const colorByKind = {
    industry: "text-pachi-cyan",
    shop: "text-pachi-green",
    event: "text-pachi-yellow",
    rumor: "text-pachi-pink",
  } as const;
  return (
    <section className="pixel-panel p-3">
      <p className="font-pixel text-[10px] text-pachi-cyan mb-2">
        業界最新ニュース
      </p>
      <ul className="space-y-1 text-[11px] text-white/80 leading-relaxed">
        {newsItems.slice(0, 6).map((n) => (
          <li key={n.id} className="flex gap-2">
            <span className={`font-pixel text-[9px] shrink-0 ${colorByKind[n.kind]}`}>
              [{n.kind === "industry" ? "業界" : n.kind === "shop" ? "店舗" : n.kind === "event" ? "速報" : "噂"}]
            </span>
            <span>{n.text}</span>
          </li>
        ))}
      </ul>
      {newsItems.length > 6 && (
        <p className="text-[9px] text-white/40 mt-2">
          ※ さらに {newsItems.length - 6} 件
        </p>
      )}
    </section>
  );
}
