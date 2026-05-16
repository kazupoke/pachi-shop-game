import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shortId } from "../lib/id";

/**
 * ライトモード専用ストア
 * - 経済シミュ無し: 機種を選んで P-World 風ページを作るだけ
 * - 既存の useGameStore とは完全独立
 * - localStorage キー: "pachi-lite-v1"
 */

export interface LiteShop {
  id: string;
  name: string;
  /** 系列 ID (SHOP_SERIES の id) */
  seriesId: string | null;
  /** 機種ID -> 台数 */
  entries: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface LiteState {
  shop: LiteShop | null;
  createShop: (name: string, seriesId?: string | null) => void;
  renameShop: (name: string) => void;
  setSeries: (seriesId: string | null) => void;
  setEntries: (entries: Record<string, number>) => void;
  setMachineCount: (machineId: string, count: number) => void;
  incrementMachine: (machineId: string, delta: number) => void;
  removeMachine: (machineId: string) => void;
  resetShop: () => void;
}

function emptyShop(name: string, seriesId: string | null = null): LiteShop {
  const now = new Date().toISOString();
  return {
    id: shortId(),
    name: name.trim() || "マイ・ライト店",
    seriesId,
    entries: {},
    createdAt: now,
    updatedAt: now,
  };
}

export const useLiteStore = create<LiteState>()(
  persist(
    (set) => ({
      shop: null,

      createShop: (name, seriesId = null) =>
        set(() => ({ shop: emptyShop(name, seriesId) })),

      renameShop: (name) =>
        set((s) =>
          s.shop
            ? {
                shop: {
                  ...s.shop,
                  name: name.trim() || s.shop.name,
                  updatedAt: new Date().toISOString(),
                },
              }
            : s
        ),

      setSeries: (seriesId) =>
        set((s) =>
          s.shop
            ? {
                shop: {
                  ...s.shop,
                  seriesId,
                  updatedAt: new Date().toISOString(),
                },
              }
            : s
        ),

      setEntries: (entries) =>
        set((s) => {
          const next: Record<string, number> = {};
          for (const [id, c] of Object.entries(entries)) {
            const n = Math.max(0, Math.min(999, Math.floor(c)));
            if (n > 0) next[id] = n;
          }
          if (!s.shop) {
            return {
              shop: {
                ...emptyShop("マイ・ライト店"),
                entries: next,
              },
            };
          }
          return {
            shop: {
              ...s.shop,
              entries: next,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      setMachineCount: (machineId, count) =>
        set((s) => {
          if (!s.shop) return s;
          const next = { ...s.shop.entries };
          if (count <= 0) {
            delete next[machineId];
          } else {
            next[machineId] = Math.min(count, 999);
          }
          return {
            shop: { ...s.shop, entries: next, updatedAt: new Date().toISOString() },
          };
        }),

      incrementMachine: (machineId, delta) =>
        set((s) => {
          if (!s.shop) return s;
          const cur = s.shop.entries[machineId] ?? 0;
          const nextCount = Math.max(0, Math.min(999, cur + delta));
          const next = { ...s.shop.entries };
          if (nextCount <= 0) {
            delete next[machineId];
          } else {
            next[machineId] = nextCount;
          }
          return {
            shop: { ...s.shop, entries: next, updatedAt: new Date().toISOString() },
          };
        }),

      removeMachine: (machineId) =>
        set((s) => {
          if (!s.shop) return s;
          const next = { ...s.shop.entries };
          delete next[machineId];
          return {
            shop: { ...s.shop, entries: next, updatedAt: new Date().toISOString() },
          };
        }),

      resetShop: () => set(() => ({ shop: null })),
    }),
    {
      name: "pachi-lite-v1",
      version: 2,
      migrate: (persistedState, version) => {
        const s = persistedState as { shop?: Partial<LiteShop> } | undefined;
        if (version < 2 && s?.shop) {
          if (s.shop.seriesId === undefined) s.shop.seriesId = null;
        }
        return persistedState as LiteState;
      },
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const LITE_MAX_MACHINES = 100;
export const LITE_MAX_TYPES = 25;

export function totalMachines(shop: LiteShop | null): number {
  if (!shop) return 0;
  let n = 0;
  for (const c of Object.values(shop.entries)) n += c;
  return n;
}

export function totalKinds(shop: LiteShop | null): number {
  if (!shop) return 0;
  return Object.keys(shop.entries).length;
}

/** 容量超過しているか */
export function isOverCapacity(shop: LiteShop | null): {
  over: boolean;
  overMachines: boolean;
  overTypes: boolean;
} {
  const m = totalMachines(shop);
  const k = totalKinds(shop);
  const overMachines = m > LITE_MAX_MACHINES;
  const overTypes = k > LITE_MAX_TYPES;
  return { over: overMachines || overTypes, overMachines, overTypes };
}
