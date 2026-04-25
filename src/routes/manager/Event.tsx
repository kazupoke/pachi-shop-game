import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { useGameStore } from "../../stores/useGameStore";
import {
  SPECIAL_EVENTS,
  SPECIAL_EVENTS_BY_ID,
  calendarEventOf,
} from "../../lib/event";

export function Event() {
  const navigate = useNavigate();
  const cash = useGameStore((s) => s.user?.cash ?? 0);
  const activeEvent = useGameStore((s) => s.activeEvent);
  const selectTodayEvent = useGameStore((s) => s.selectTodayEvent);
  const [msg, setMsg] = useState<string | null>(null);
  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(null), 2200);
  };

  const today = new Date();
  const calEvent = calendarEventOf(today);
  const todayKey = today.toISOString().slice(0, 10);
  const isAppliedToday = activeEvent && activeEvent.appliedDate === todayKey;
  const currentEv =
    isAppliedToday && activeEvent ? SPECIAL_EVENTS_BY_ID[activeEvent.specialId ?? ""] : null;

  const handleSelect = (id: string) => {
    if (currentEv) {
      flash("本日は既にイベント発動中");
      return;
    }
    const r = selectTodayEvent(id);
    if (!r.ok) {
      flash(r.reason === "no-cash" ? "資金不足" : "発動失敗");
      return;
    }
    const ev = SPECIAL_EVENTS_BY_ID[id];
    flash(`${ev?.emoji ?? ""} ${ev?.name ?? "イベント"} 発動！`);
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="イベント日"
        subtitle={`所持金 ¥${cash.toLocaleString()}`}
      />
      <div className="px-4 pt-2">
        <button
          onClick={() => navigate("/manager")}
          className="text-[11px] text-white/60 underline"
        >
          ← 店長メニューに戻る
        </button>
      </div>

      {msg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-pachi-yellow text-bg-base font-dot text-xs shadow-pixel">
          {msg}
        </div>
      )}

      {/* 今日のカレンダー判定 */}
      <div className="px-4 mt-3">
        <div className="pixel-panel p-3">
          <p className="font-pixel text-[10px] text-pachi-cyan mb-2">
            本日 ({today.getMonth() + 1}/{today.getDate()})
          </p>
          {calEvent ? (
            <div className={`flex items-baseline gap-2 ${calEvent.color}`}>
              <span className="text-2xl">{calEvent.emoji}</span>
              <div>
                <p className="font-pixel text-xs">{calEvent.name}</p>
                <p className="text-[10px] text-white/60 mt-0.5">{calEvent.desc}</p>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-white/60">通常営業日 (カレンダー特典なし)</p>
          )}
          <p className="text-[9px] text-white/40 mt-2 leading-relaxed">
            ※ カレンダーイベントは毎日自動で適用されます
          </p>
        </div>
      </div>

      {/* 今日選んだスペシャル */}
      <div className="px-4 mt-3">
        {currentEv ? (
          <div className={`pixel-panel p-3 border-2 border-pachi-yellow`}>
            <p className="font-pixel text-[10px] text-pachi-yellow mb-2">
              ★ 本日発動中
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">{currentEv.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-pixel text-xs ${currentEv.color}`}>
                  {currentEv.name}
                </p>
                <p className="text-[10px] text-white/70 mt-0.5">{currentEv.desc}</p>
                <p className="text-[10px] text-pachi-yellow mt-1">
                  集客 ×{currentEv.attractMul.toFixed(2)} ・ 機械割 +{currentEv.payoutBonus}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-white/60 text-center">
            本日のスペシャルイベントはまだ未選択
          </p>
        )}
      </div>

      {/* 候補一覧 */}
      <ul className="px-3 mt-3 space-y-2">
        {SPECIAL_EVENTS.map((ev) => {
          const canAfford = cash >= ev.cost;
          const isCurrent = currentEv?.id === ev.id;
          return (
            <li
              key={ev.id}
              className={`pixel-panel p-3 border-2 ${
                isCurrent ? "border-pachi-yellow" : "border-bg-card"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-2xl shrink-0">{ev.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-pixel text-xs ${ev.color}`}>{ev.name}</p>
                  <p className="text-[10px] text-white/60 mt-1">{ev.desc}</p>
                  <p className="text-[10px] mt-1 text-white/80">
                    集客 ×{ev.attractMul.toFixed(2)}
                    {ev.payoutBonus > 0 && ` ・ 機械割 +${ev.payoutBonus}%`}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-pixel text-[11px] text-pachi-yellow">
                  ¥{ev.cost.toLocaleString()}
                </span>
                <button
                  onClick={() => handleSelect(ev.id)}
                  disabled={!canAfford || !!currentEv}
                  className="pixel-btn text-[11px] px-3 py-1 disabled:opacity-30"
                >
                  {isCurrent
                    ? "発動中"
                    : currentEv
                    ? "本日選択済"
                    : canAfford
                    ? "発動"
                    : "資金不足"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="px-4 mt-4 text-[10px] text-white/40 leading-relaxed">
        ※ スペシャルイベントは 1 営業日 (リアル 4 時間) 持続。<br />
        ※ 翌営業日になると自動で解除されます。
      </p>
    </div>
  );
}
