import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { useGameStore } from "../../stores/useGameStore";
import { PERFORMERS, PERFORMERS_BY_ID } from "../../lib/performer";
import { CATEGORY_LABELS } from "../../lib/customer";

export function Performer() {
  const navigate = useNavigate();
  const cash = useGameStore((s) => s.user?.cash ?? 0);
  const active = useGameStore((s) => s.activePerformer);
  const hire = useGameStore((s) => s.hireTodayPerformer);
  const [msg, setMsg] = useState<string | null>(null);
  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(null), 2200);
  };

  const today = new Date().toISOString().slice(0, 10);
  const isAppliedToday = active && active.appliedDate === today;
  const currentP = isAppliedToday && active ? PERFORMERS_BY_ID[active.performerId] : null;

  const handleHire = (id: string) => {
    if (currentP) {
      flash("本日は既に演者を呼んでいます");
      return;
    }
    const r = hire(id);
    if (!r.ok) {
      flash(r.reason === "no-cash" ? "資金不足" : "依頼失敗");
      return;
    }
    const p = PERFORMERS_BY_ID[id];
    flash(`${p?.emoji ?? ""} ${p?.name ?? "演者"} 来店！`);
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="来店演者"
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

      {/* 本日来店中 */}
      <div className="px-4 mt-3">
        {currentP ? (
          <div className="pixel-panel p-3 border-2 border-pachi-pink">
            <p className="font-pixel text-[10px] text-pachi-pink mb-2">
              ★ 本日来店中
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl">{currentP.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-pixel text-xs ${currentP.color}`}>
                  {currentP.name}
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">{currentP.title}</p>
                <p className="text-[10px] text-pachi-yellow mt-1">
                  集客 ×{currentP.attractMul.toFixed(2)}
                  {currentP.affinity &&
                    ` ・ ${CATEGORY_LABELS[currentP.affinity]} の常連 UP`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-white/60 text-center">
            本日の演者はまだ未依頼
          </p>
        )}
      </div>

      {/* 候補一覧 */}
      <ul className="px-3 mt-3 space-y-2">
        {PERFORMERS.map((p) => {
          const canAfford = cash >= p.cost;
          const isCurrent = currentP?.id === p.id;
          return (
            <li
              key={p.id}
              className={`pixel-panel p-3 border-2 ${
                isCurrent ? "border-pachi-pink" : "border-bg-card"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-3xl shrink-0">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-pixel text-xs ${p.color}`}>{p.name}</p>
                  <p className="text-[10px] text-white/60 mt-0.5">{p.title}</p>
                  <p className="text-[10px] text-white/70 mt-1">{p.desc}</p>
                  <p className="text-[10px] mt-1 text-white/80">
                    集客 ×{p.attractMul.toFixed(2)}
                    {p.affinity &&
                      ` ・ ${CATEGORY_LABELS[p.affinity]} 親和`}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-pixel text-[11px] text-pachi-yellow">
                  ¥{p.cost.toLocaleString()}
                </span>
                <button
                  onClick={() => handleHire(p.id)}
                  disabled={!canAfford || !!currentP}
                  className="pixel-btn text-[11px] px-3 py-1 disabled:opacity-30"
                >
                  {isCurrent
                    ? "来店中"
                    : currentP
                    ? "本日依頼済"
                    : canAfford
                    ? "依頼"
                    : "資金不足"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="px-4 mt-4 text-[10px] text-white/40 leading-relaxed">
        ※ 演者は 1 営業日 (リアル 4 時間) のみ来店。<br />
        ※ 親和カテゴリの常連がレベルアップしやすくなります。
      </p>
    </div>
  );
}
