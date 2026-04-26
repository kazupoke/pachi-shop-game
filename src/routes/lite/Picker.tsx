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
import { KANA_FILTERS, YEAR_BUCKETS, getKanaKey } from "../../lib/machineSort";

const RARITY_ORDER: Rarity[] = ["SSR", "SR", "R", "N"];
const RARITY_COLOR: Record<Rarity, string> = {
  N: "text-rarity-n",
  R: "text-rarity-r",
  SR: "text-rarity-sr",
  SSR: "text-rarity-ssr",
};

type ViewFilter = "all" | "selected";
type SortKey = "rarityYear" | "yearDesc" | "yearAsc" | "name" | "makerGroup";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "rarityYear", label: "レア順" },
  { key: "yearDesc", label: "新しい順" },
  { key: "yearAsc", label: "古い順" },
  { key: "name", label: "名前順" },
  { key: "makerGroup", label: "系列順" },
];

export function LitePicker() {
  const navigate = useNavigate();
  const shop = useLiteStore((s) => s.shop);
  const incrementMachine = useLiteStore((s) => s.incrementMachine);

  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [groupFilter, setGroupFilter] = useState<MakerGroup | "all">("all");
  const [kanaFilter, setKanaFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rarityYear");
  const [includeOldGen, setIncludeOldGen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const entries = shop?.entries;
  const machines = useMemo(() => {
    let list: Machine[] = ALL_MACHINES;
    // 初期は 6 号機のみ。トグルで 4/5 号機も表示
    if (!includeOldGen) {
      list = list.filter((m) => m.generation === 6);
    }
    if (rarityFilter !== "all") {
      list = list.filter((m) => m.rarity === rarityFilter);
    }
    if (groupFilter !== "all") {
      list = list.filter((m) => getMakerGroup(m.maker) === groupFilter);
    }
    if (kanaFilter !== "all") {
      list = list.filter((m) => getKanaKey(m.name) === kanaFilter);
    }
    if (yearFilter !== "all") {
      const bucket = YEAR_BUCKETS.find((b) => b.key === yearFilter);
      if (bucket) list = list.filter((m) => bucket.test(m.releaseYear));
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
      // 「設置中」ビューでは固定で 台数DESC + 年代DESC
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
        case "makerGroup": {
          const ga = getMakerGroup(a.maker);
          const gb = getMakerGroup(b.maker);
          const r = MAKER_GROUPS.indexOf(ga) - MAKER_GROUPS.indexOf(gb);
          if (r !== 0) return r;
          if (a.maker !== b.maker) return a.maker.localeCompare(b.maker, "ja");
          return b.releaseYear - a.releaseYear;
        }
        case "rarityYear":
        default: {
          const r = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
          if (r !== 0) return r;
          return b.releaseYear - a.releaseYear;
        }
      }
    });
    return sorted;
  }, [rarityFilter, groupFilter, kanaFilter, yearFilter, viewFilter, sortKey, entries, includeOldGen, keyword]);

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

  const clearFilters = () => {
    setRarityFilter("all");
    setGroupFilter("all");
    setKanaFilter("all");
    setYearFilter("all");
    setViewFilter("all");
    setKeyword("");
  };

  const activeFilterCount =
    (rarityFilter !== "all" ? 1 : 0) +
    (groupFilter !== "all" ? 1 : 0) +
    (kanaFilter !== "all" ? 1 : 0) +
    (yearFilter !== "all" ? 1 : 0) +
    (includeOldGen ? 1 : 0);

  const cap = isOverCapacity(shop);
  const totalM = totalMachines(shop);
  const totalK = totalKinds(shop);

  return (
    <div>
      <PageHeader
        title="機種を選ぶ"
        subtitle={`${shop.name}`}
      />

      {/* 検索・フィルタ群 (上部固定 / コンパクト) */}
      <div className="sticky top-[84px] z-10 bg-bg-base pb-2 border-b-2 border-bg-card">
        {/* 進捗バー (大きめ) */}
        <div className="px-4 pt-2">
          <div
            className={`p-2 border-2 ${
              cap.over
                ? "bg-pachi-red/15 border-pachi-red animate-blink"
                : totalM === LITE_MAX_MACHINES && totalK === LITE_MAX_TYPES
                ? "bg-pachi-yellow/15 border-pachi-yellow"
                : "bg-bg-panel border-bg-card"
            }`}
          >
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="font-pixel text-[10px] text-pachi-cyan">
                {totalM === LITE_MAX_MACHINES && totalK === LITE_MAX_TYPES && !cap.over
                  ? "★ COMPLETE!"
                  : "選択進捗"}
              </span>
              <button
                onClick={() => navigate("/lite/view")}
                className="font-pixel text-[10px] bg-pachi-yellow text-bg-base px-2 py-0.5 border border-pachi-yellow"
              >
                一覧 ▶
              </button>
            </div>
            <ProgressBar
              label="台数"
              current={totalM}
              max={LITE_MAX_MACHINES}
              over={cap.overMachines}
            />
            <div className="mt-1">
              <ProgressBar
                label="機種"
                current={totalK}
                max={LITE_MAX_TYPES}
                over={cap.overTypes}
              />
            </div>
          </div>
        </div>

        {/* 検索 + 絞り込みボタン */}
        <div className="px-4 pt-2 flex gap-2 items-center">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="🔍 機種名・メーカー・系列"
            className="flex-1 px-3 py-2 bg-bg-base border-2 border-bg-card text-white font-dot text-xs focus:border-pachi-pink outline-none"
          />
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`shrink-0 px-3 py-2 font-pixel text-[10px] border-2 ${
              activeFilterCount > 0 || filterOpen
                ? "bg-pachi-pink border-pachi-pink text-white"
                : "bg-bg-panel border-bg-card text-white/70"
            }`}
          >
            絞り込み{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}{" "}
            {filterOpen ? "▲" : "▼"}
          </button>
        </div>

        {/* レアリティ + ビュー + ソート (常時表示・1行) */}
        <div className="px-4 pt-2 flex gap-1 text-[11px] items-center overflow-x-auto">
          <button
            onClick={() => setViewFilter("all")}
            className={`shrink-0 px-2 py-1 font-dot border-2 ${
              viewFilter === "all"
                ? "bg-pachi-red text-white border-pachi-red"
                : "bg-bg-panel text-white/60 border-bg-card"
            }`}
          >
            全
          </button>
          <button
            onClick={() => setViewFilter("selected")}
            className={`shrink-0 px-2 py-1 font-dot border-2 ${
              viewFilter === "selected"
                ? "bg-pachi-red text-white border-pachi-red"
                : "bg-bg-panel text-white/60 border-bg-card"
            }`}
          >
            選択中
          </button>
          <span className="w-1 shrink-0" />
          {(["all", "SSR", "SR", "R", "N"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`shrink-0 px-2 py-1 font-dot border whitespace-nowrap ${
                rarityFilter === r
                  ? "bg-pachi-pink border-pachi-pink"
                  : "bg-bg-panel border-bg-card text-white/60"
              }`}
            >
              {r === "all" ? "全レア" : r}
            </button>
          ))}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="ml-auto shrink-0 px-2 py-1 font-dot text-[11px] bg-bg-panel border-2 border-bg-card text-white"
            aria-label="並び替え"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* 詳細フィルタ (折りたたみ) */}
        {filterOpen && (
          <div className="px-4 pt-2 space-y-2 border-t border-bg-card mt-2">
            {/* 世代トグル */}
            <div className="flex items-center justify-between pt-2">
              <span className="font-pixel text-[10px] text-pachi-cyan">世代</span>
              <button
                onClick={() => setIncludeOldGen((v) => !v)}
                className={`px-2 py-1 font-dot text-[10px] border-2 ${
                  includeOldGen
                    ? "bg-pachi-pink border-pachi-pink text-white"
                    : "bg-bg-panel border-bg-card text-white/70"
                }`}
              >
                {includeOldGen ? "全世代 (4/5/6 号機)" : "6 号機のみ"}
              </button>
            </div>

            {/* 50 音 */}
            <div>
              <p className="font-pixel text-[9px] text-pachi-cyan mb-1">50 音</p>
              <div className="flex gap-1 text-[11px] flex-wrap">
                <ChipBtn
                  label="全て"
                  active={kanaFilter === "all"}
                  onClick={() => setKanaFilter("all")}
                />
                {KANA_FILTERS.map((k) => (
                  <ChipBtn
                    key={k.key}
                    label={k.label}
                    active={kanaFilter === k.key}
                    onClick={() => setKanaFilter(k.key)}
                  />
                ))}
              </div>
            </div>

            {/* 年代 */}
            <div>
              <p className="font-pixel text-[9px] text-pachi-cyan mb-1">年代</p>
              <div className="flex gap-1 text-[11px] flex-wrap">
                <ChipBtn
                  label="全年代"
                  active={yearFilter === "all"}
                  onClick={() => setYearFilter("all")}
                />
                {YEAR_BUCKETS.map((b) => (
                  <ChipBtn
                    key={b.key}
                    label={b.label}
                    active={yearFilter === b.key}
                    onClick={() => setYearFilter(b.key)}
                  />
                ))}
              </div>
            </div>

            {/* メーカー系列 */}
            <div>
              <p className="font-pixel text-[9px] text-pachi-cyan mb-1">メーカー系列</p>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <ChipBtn
                  label="全系列"
                  active={groupFilter === "all"}
                  onClick={() => setGroupFilter("all")}
                />
                {MAKER_GROUPS.map((g) => (
                  <ChipBtn
                    key={g}
                    label={g}
                    active={groupFilter === g}
                    onClick={() => setGroupFilter(g)}
                  />
                ))}
              </div>
            </div>

            <div className="pt-1 pb-1 flex justify-between items-center">
              <button
                onClick={clearFilters}
                className="text-[10px] text-white/60 underline"
              >
                フィルタをクリア
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="font-pixel text-[10px] bg-bg-panel border-2 border-bg-card px-3 py-1 text-white/80"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
      {/* /sticky filter wrapper */}

      <ul className="px-4 py-3 space-y-2">
        {machines.length === 0 ? (
          <li className="text-center text-xs text-white/50 py-8">該当なし</li>
        ) : (
          machines.map((m) => {
            const count = shop.entries[m.id] ?? 0;
            const group = getMakerGroup(m.maker);
            const isSelected = count > 0;
            return (
              <li
                key={m.id}
                className={`pixel-panel p-3 flex items-center gap-3 transition-colors ${
                  isSelected
                    ? "bg-pachi-green/10 border-pachi-green border-2"
                    : ""
                }`}
              >
                <div className="w-12 h-16 shrink-0 border border-bg-card relative">
                  <MachineThumb
                    machineId={m.id}
                    name={m.name}
                    rarity={m.rarity}
                    size={96}
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
                    {m.maker}{" "}
                    <span className="text-pachi-cyan">[{group}]</span> ·{" "}
                    {m.releaseYear}
                  </p>
                  <p
                    className={`text-[10px] font-pixel mt-0.5 ${RARITY_COLOR[m.rarity]}`}
                  >
                    {m.rarity} · {m.type}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => incrementMachine(m.id, -1)}
                      disabled={count === 0}
                      className="w-10 h-10 font-pixel text-base bg-bg-base border-2 border-bg-card text-white disabled:opacity-30 active:translate-y-0.5"
                      aria-label="台数を減らす"
                    >
                      −
                    </button>
                    <span
                      className={`font-pixel text-base w-10 text-center ${
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
                      className="w-10 h-10 font-pixel text-base bg-pachi-red border-2 border-pachi-red text-white disabled:opacity-30 active:translate-y-0.5"
                      aria-label="台数を増やす"
                    >
                      ＋
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (count === 0 && totalK >= LITE_MAX_TYPES) return;
                      const room = LITE_MAX_MACHINES - totalM;
                      const inc = Math.min(5, room);
                      if (inc > 0) incrementMachine(m.id, inc);
                    }}
                    disabled={
                      totalM >= LITE_MAX_MACHINES ||
                      (count === 0 && totalK >= LITE_MAX_TYPES)
                    }
                    className="font-pixel text-[10px] px-2 py-1 bg-pachi-yellow text-bg-base border-2 border-pachi-yellow disabled:opacity-30"
                  >
                    ＋5
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className="sticky bottom-0 bg-bg-panel border-t-2 border-bg-card px-4 py-3">
        {cap.over && (
          <p className="text-[10px] text-pachi-red text-center mb-2 animate-blink">
            ⚠ 容量オーバー: 一覧で {cap.overMachines && `台数 (${totalM}/${LITE_MAX_MACHINES})`}
            {cap.overMachines && cap.overTypes && " と "}
            {cap.overTypes && `機種 (${totalK}/${LITE_MAX_TYPES})`} を調整してください
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
                ? "pixel-btn text-xs animate-blink bg-pachi-red"
                : "pixel-btn text-xs"
            }
          >
            {cap.over ? "一覧で調整 ▶" : "ページを見る"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChipBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 font-dot whitespace-nowrap border ${
        active
          ? "bg-pachi-pink border-pachi-pink text-white"
          : "bg-bg-panel border-bg-card text-white/60"
      }`}
    >
      {label}
    </button>
  );
}

function ProgressBar({
  label,
  current,
  max,
  over,
}: {
  label: string;
  current: number;
  max: number;
  over: boolean;
}) {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div>
      <div className="flex justify-between items-baseline text-[10px]">
        <span className="font-pixel text-white/70">{label}</span>
        <span
          className={`font-pixel ${
            over
              ? "text-pachi-red"
              : current === max
              ? "text-pachi-yellow"
              : "text-white"
          }`}
        >
          {current} / {max}
        </span>
      </div>
      <div className="mt-0.5 h-2 bg-bg-base border border-bg-card overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            over
              ? "bg-pachi-red"
              : current === max
              ? "bg-pachi-yellow"
              : "bg-pachi-green"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
