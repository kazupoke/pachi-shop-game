import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { MachineThumb } from "../../components/MachineThumb";
import { useGameStore } from "../../stores/useGameStore";
import { MACHINES_BY_ID } from "../../data/machines";
import {
  ALL_SETTINGS,
  attractFactor,
  payoutRate,
  settingColor,
  type SettingValue,
} from "../../lib/setting";
import type { Rarity } from "../../lib/types";

const RARITY_ORDER: Rarity[] = ["SSR", "SR", "R", "N"];

function dateOffsetKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function dateLabel(offset: number): string {
  if (offset === 0) return "本日";
  if (offset === 1) return "明日";
  if (offset === 2) return "明後日";
  if (offset === 3) return "3日後";
  return `${offset}日後`;
}

export function Schedule() {
  const navigate = useNavigate();
  const shop = useGameStore((s) => s.shop);
  const scheduledSettings = useGameStore((s) => s.scheduledSettings);
  const scheduleSetting = useGameStore((s) => s.scheduleSetting);
  const clearScheduledSetting = useGameStore((s) => s.clearScheduledSetting);
  const setMachineSetting = useGameStore((s) => s.setMachineSetting);

  const [offset, setOffset] = useState(1);
  const dateKey = dateOffsetKey(offset);
  const isToday = offset === 0;

  const layout = useMemo(() => {
    if (!shop) return [];
    return [...shop.layout].sort((a, b) => {
      const ma = MACHINES_BY_ID[a.machineId];
      const mb = MACHINES_BY_ID[b.machineId];
      if (!ma || !mb) return 0;
      const r =
        RARITY_ORDER.indexOf(ma.rarity) - RARITY_ORDER.indexOf(mb.rarity);
      if (r !== 0) return r;
      return mb.releaseYear - ma.releaseYear;
    });
  }, [shop?.layout]);

  if (!shop || layout.length === 0) {
    return (
      <div className="pb-6">
        <PageHeader title="設定スケジュール" subtitle="3 日先まで自動設定" />
        <div className="px-4 pt-2">
          <button
            onClick={() => navigate("/manager")}
            className="text-[11px] text-white/60 underline"
          >
            ← 店長メニューに戻る
          </button>
        </div>
        <div className="mx-4 mt-4 pixel-panel p-4 text-center text-[11px] text-white/60">
          台が設置されていません
        </div>
      </div>
    );
  }

  const dayMap = scheduledSettings[dateKey] ?? {};
  const scheduledCount = Object.keys(dayMap).length;

  const handleSelect = (machineId: string, s: SettingValue) => {
    if (isToday) {
      // 今日は即時反映
      setMachineSetting(machineId, s);
    } else {
      scheduleSetting(dateKey, machineId, s);
    }
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="設定スケジュール"
        subtitle={`${dateLabel(offset)} (${dateKey}) · 予約 ${scheduledCount} 件`}
      />
      <div className="px-4 pt-2">
        <button
          onClick={() => navigate("/manager")}
          className="text-[11px] text-white/60 underline"
        >
          ← 店長メニューに戻る
        </button>
      </div>

      <div className="px-3 mt-3">
        <div className="grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((d) => {
            const m = scheduledSettings[dateOffsetKey(d)] ?? {};
            const c = Object.keys(m).length;
            return (
              <button
                key={d}
                onClick={() => setOffset(d)}
                className={`py-2 font-pixel text-[10px] border-2 ${
                  offset === d
                    ? "bg-pachi-pink border-pachi-pink text-white"
                    : "bg-bg-base border-bg-card text-white/70"
                }`}
              >
                {dateLabel(d)}
                <br />
                <span className="text-[8px] text-white/60">
                  {d === 0 ? "(現在)" : c > 0 ? `${c}件予約` : "未予約"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="pixel-panel p-2 text-[10px]">
          <p className="font-pixel text-pachi-cyan mb-1">
            {isToday ? "本日の設定" : `${dateLabel(offset)}の予約`}
          </p>
          <p className="text-white/70 leading-relaxed">
            {isToday
              ? "今日の設定変更は即時反映されます。"
              : "選択した設定は、その日の営業開始時に自動適用されます。"}
          </p>
        </div>
      </div>

      <ul className="px-4 mt-3 space-y-2">
        {layout.map((entry) => {
          const m = MACHINES_BY_ID[entry.machineId];
          if (!m) return null;
          const cur = isToday
            ? ((entry.setting ?? 1) as SettingValue)
            : ((dayMap[entry.machineId] ?? null) as SettingValue | null);
          return (
            <li key={entry.machineId} className="pixel-panel p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-16 shrink-0 border border-bg-card">
                  <MachineThumb
                    machineId={m.id}
                    name={m.name}
                    rarity={m.rarity}
                    size={48}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{m.name}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    {m.maker} · ×{entry.count}
                  </p>
                  <p className="text-[10px] mt-0.5">
                    現在:{" "}
                    <span
                      className={`font-pixel ${settingColor((entry.setting ?? 1) as SettingValue)}`}
                    >
                      設定 {entry.setting ?? 1}
                    </span>
                    {!isToday && cur && (
                      <span className="text-white/40 ml-2">
                        →{" "}
                        <span className={`font-pixel ${settingColor(cur)}`}>
                          設定 {cur}
                        </span>{" "}
                        (機械割 {payoutRate(m.rarity, cur).toFixed(1)}% / 客付 ×
                        {attractFactor(cur).toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {ALL_SETTINGS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSelect(m.id, s)}
                    className={`py-1.5 font-pixel text-xs border-2 ${
                      cur === s
                        ? "bg-pachi-pink border-pachi-pink text-white"
                        : "bg-bg-base border-bg-card text-white/60"
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {!isToday && (
                  <button
                    onClick={() => clearScheduledSetting(dateKey, m.id)}
                    className="py-1.5 font-pixel text-[9px] border-2 border-bg-card text-white/40"
                  >
                    解除
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
