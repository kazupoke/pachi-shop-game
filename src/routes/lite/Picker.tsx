import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ALL_MACHINES } from "../../data/machines";
import { PageHeader } from "../../components/PageHeader";
import { MachineThumb } from "../../components/MachineThumb";
import {
  useLiteStore,
  totalMachines,
  totalKinds,
  isOverCapacity,
  LITE_MAX_MACHINES,
  LITE_MAX_TYPES,
} from "../../stores/useLiteStore";
import type { Machine, Rarity } from "../../lib/types";
import { MAKER_GROUPS, getMakerGroup, type MakerGroup } from "../../data/makerGroups";
import { YEAR_BUCKETS } from "../../lib/machineSort";

const RARITY_ORDER: Rarity[] = ["SSR", "SR", "R", "N"];
const RARITY_COLOR: Record<Rarity, string> = {
  N: "text-rarity-n",
  R: "text-rarity-r",
  SR: "text-rarity-sr",
  SSR: "text-rarity-ssr",
};

type ViewFilter = "all" | "selected";
type SortKey = "rarityYear" | "yearDesc" | "yearAsc" | "name";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "rarityYear", label: "おすすめ順" },
  { key: "yearDesc", label: "新しい順" },
  { key: "yearAsc", label: "古い順" },
  { key: "name", label: "名前順" },
];

export function LitePicker() {
  const navigate = useNavigate();
  const shop = useLiteStore((s) => s.shop);
  const incrementMachine = useLiteStore((s) => s.incrementMachine);

  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rarityYear");
  const [keyword, setKeyword] = useState("");
  const [includeOldGen, setIncludeOldGen] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<MakerGroup | "all">("all");

  const entries = shop?.entries;
  const machines = useMemo(() => {
    let list: Machine[] = ALL_MACHINES;
    if (!includeOldGen) {
      list = list.filter((m) => m.generation === 6);
    }
    if (yearFilter !== "all") {
      const bucket = YEAR_BUCKETS.find((b) => b.key === yearFilter);
      if (bucket) list = list.filter((m) => bucket.test(m.releaseYear));
    }
    if (groupFilter !== "all") {
      list = list.filter((m) => getMakerGroup(m.maker) === groupFilter);
    }
    if (viewFilter === "selected") {
      list = list.filter((m) => (entries?.[m.id] ?? 0) > 0);
    }
    const k = keyword.trim().toLowerCase();
    if (k) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(k) ||
          m.maker.toLowerCase().includes(k) ||
          getMakerGroup(m.maker).toLowerCase().includes(k)
      );
    }
    const sorted = [...list].sort((a, b) => {
      if (viewFilter === "selected") {
        const ca = entries?.[a.id] ?? 0;
        const cb = entries?.[b.id] ?? 0;
        if (cb !== ca) return cb - ca;
        return b.releaseYear - a.releaseYear;
      }
      switch (sortKey) {
        case "yearDesc":
          return b.releaseYear - a.releaseYear || a.name.localeCompare(b.name, "ja");
        case "yearAsc":
          return a.releaseYear - b.releaseYear || a.name.localeCompare(b.name, "ja");
        case "name":
          return a.name.localeCompare(b.name, "ja");
        case "rarityYear":
        default: {
          const r = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
          if (r !== 0) return r;
          return b.releaseYear - a.releaseYear;
        }
      }
    });
    return sorted;
  }, [viewFilter, sortKey, entries, includeOldGen, keyword, yearFilter, groupFilter]);

  if (!shop) {
    return (
      <div className="p-6 text-center text-sm text-white/70">
        <p>ライトモードのお店がありません。</p>
        <button
          onClick={() => navigate("/lite")}
          className="pixel-btn mt-6 text-xs"
        >
          お店を作る
        </button>
      </div>
    );
  }

  const cap = isOverCapacity(shop);
  const totalM = totalMachines(shop);
  const totalK = totalKinds(shop);

  return (
    <div>
      <PageHeader
        title="機種を選ぶ"
        subtitle={`${totalM}/${LITE_MAX_MACHINES}台 · ${totalK}/${LITE_MAX_TYPES}機種`}
      />

      {/* ツールバー (普通の position) */}
      <div className="px-4 pt-3 space-y-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="🔍 機種名で検索"
          className="block w-full px-3 py-2 bg-bg-base border-2 border-bg-card text-white font-dot text-sm focus:border-pachi-pink outline-none"
        />
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setViewFilter("all")}
            className={`px-3 py-2 font-dot text-xs border-2 ${
              viewFilter === "all"
                ? "bg-pachi-red text-white border-pachi-red"
                : "bg-bg-panel text-white/60 border-bg-card"
            }`}
          >
            全機種
          </button>
          <button
            onClick={() => setViewFilter("selected")}
            className={`px-3 py-2 font-dot text-xs border-2 ${
              viewFilter === "selected"
                ? "bg-pachi-red text-white border-pachi-red"
                : "bg-bg-panel text-white/60 border-bg-card"
            }`}
          >
            選択中 ({totalK})
          </button>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="ml-auto px-2 py-2 font-dot text-xs bg-bg-panel border-2 border-bg-card text-white"
            aria-label="並び替え"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="flex-1 px-2 py-2 font-dot text-xs bg-bg-panel border-2 border-bg-card text-white"
            aria-label="年代"
          >
            <option value="all">年代: 全て</option>
            {YEAR_BUCKETS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as MakerGroup | "all")}
            className="flex-1 px-2 py-2 font-dot text-xs bg-bg-panel border-2 border-bg-card text-white"
            aria-label="メーカー系列"
          >
            <option value="all">メーカー: 全て</option>
            {MAKER_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-white/70">
          <input
            type="checkbox"
            checked={includeOldGen}
            onChange={(e) => setIncludeOldGen(e.target.checked)}
            className="accent-pachi-pink"
          />
          4/5号機も含める ({includeOldGen ? "ON" : "OFF"})
        </label>
      </div>

      {/* 容量カウンタ (上部、普通の position) */}
      <div className="px-4 pt-3">
        <div
          className={`px-3 py-2 border-2 font-pixel text-xs flex justify-between items-center ${
            cap.over
              ? "bg-pachi-red/15 border-pachi-red text-pachi-red"
              : "bg-bg-panel border-bg-card text-white"
          }`}
        >
          <span>
            <span className={cap.overMachines ? "text-pachi-red" : ""}>{totalM}</span>
            <span className="text-white/40"> / {LITE_MAX_MACHINES}台</span>
          </span>
          <span>
            <span className={cap.overTypes ? "text-pachi-red" : ""}>{totalK}</span>
            <span className="text-white/40"> / {LITE_MAX_TYPES}機種</span>
          </span>
        </div>
      </div>

      <ul className="px-4 py-3 space-y-2">
        {machines.length === 0 ? (
          <li className="text-center text-xs text-white/50 py-8">
            該当なし
          </li>
        ) : (
          machines.map((m) => {
            const count = shop.entries[m.id] ?? 0;
            const isSelected = count > 0;
            return (
              <li
                key={m.id}
                className={`pixel-panel p-3 flex items-center gap-3 ${
                  isSelected ? "bg-pachi-green/10 border-pachi-green border-2" : ""
                }`}
              >
                <div className="w-12 h-16 shrink-0 border border-bg-card relative">
                  <MachineThumb
                    machineId={m.id}
                    name={m.name}
                    rarity={m.rarity}
                    size={48}
                  />
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 bg-pachi-green text-bg-base font-pixel text-[8px] px-1 leading-none py-0.5">
                      ✓
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{m.name}</p>
                  <p className="text-[10px] text-white/50 mt-0.5 truncate">
                    {m.maker} · {m.releaseYear}
                  </p>
                  <p className={`text-[10px] font-pixel mt-0.5 ${RARITY_COLOR[m.rarity]}`}>
                    {m.rarity} · {m.type}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => incrementMachine(m.id, -1)}
                    disabled={count === 0}
                    className="w-8 h-8 font-pixel text-sm bg-bg-base border-2 border-bg-card text-white disabled:opacity-30"
                    aria-label="台数を減らす"
                  >
                    −
                  </button>
                  <span
                    className={`font-pixel text-xs w-8 text-center ${
                      isSelected ? "text-pachi-green" : "text-pachi-yellow"
                    }`}
                  >
                    {count}
                  </span>
                  <button
                    onClick={() => {
                      if (count === 0 && totalK >= LITE_MAX_TYPES) return;
                      if (totalM >= LITE_MAX_MACHINES) return;
                      incrementMachine(m.id, 1);
                    }}
                    disabled={
                      totalM >= LITE_MAX_MACHINES ||
                      (count === 0 && totalK >= LITE_MAX_TYPES)
                    }
                    className="w-8 h-8 font-pixel text-sm bg-pachi-red border-2 border-pachi-red text-white disabled:opacity-30"
                    aria-label="台数を増やす"
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* フッタ (普通の position、sticky なし) */}
      <div className="px-4 py-4 bg-bg-panel border-t-2 border-bg-card">
        {cap.over && (
          <p className="text-[10px] text-pachi-red text-center mb-2">
            ⚠ 容量オーバー: {cap.overMachines && `台数 (${totalM}/${LITE_MAX_MACHINES})`}
            {cap.overMachines && cap.overTypes && " と "}
            {cap.overTypes && `機種 (${totalK}/${LITE_MAX_TYPES})`}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/lite")}
            className="pixel-btn-secondary text-xs"
          >
            戻る
          </button>
          <button
            onClick={() => navigate("/lite/view")}
            className={
              cap.over
                ? "pixel-btn text-xs bg-pachi-red"
                : "pixel-btn text-xs"
            }
          >
            {cap.over ? "一覧で調整 ▶" : "ページを見る ▶"}
          </button>
        </div>
      </div>
    </div>
  );
}
