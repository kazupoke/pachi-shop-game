import { useGameStore } from "../stores/useGameStore";
import {
  monthProfit,
  totalExpense,
  BIZ_DAYS_PER_MONTH,
  MONTHLY_RENT,
  MONTHLY_ELECTRIC,
  MONTHLY_LABOR,
} from "../lib/economy";

/**
 * 売上 / 支出ダッシュボード (基本情報用)
 */
export function ShopDashboard() {
  const shop = useGameStore((s) => s.shop);
  const user = useGameStore((s) => s.user);
  const stats = useGameStore((s) => s.monthlyStats);
  const lastStats = useGameStore((s) => s.lastMonthlyStats);
  const managerLevel = useGameStore((s) => s.managerLevel);
  const managerXp = useGameStore((s) => s.managerXp);

  if (!shop) return null;

  const totalMachines = shop.layout.reduce((s, e) => s + e.count, 0);
  const playingNow = Math.min(
    totalMachines,
    Math.floor(shop.dailyCustomers / 4)
  );
  const todayRevenue = Math.round(shop.dailyCustomers * 5_000 * 0.18);
  const expense = totalExpense(stats);
  const profit = monthProfit(stats);
  const monthProgress = Math.min(100, (stats.bizDayProgress / BIZ_DAYS_PER_MONTH) * 100);
  // 店長レベルが高いほど人件費削減 (-2% / Lv, 上限 -50%)
  const managerSavings = Math.round(
    (MONTHLY_RENT + MONTHLY_ELECTRIC + MONTHLY_LABOR) *
      Math.min(0.5, (managerLevel - 1) * 0.02) *
      (stats.bizDayProgress / BIZ_DAYS_PER_MONTH)
  );

  return (
    <div className="px-4 mt-3">
      <div className="pixel-panel p-3">
        <p className="font-pixel text-[10px] text-pachi-cyan mb-2">経営ダッシュボード</p>

        {/* 月の進捗 */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">今月の進捗</span>
            <span className="font-pixel text-pachi-yellow">
              {stats.bizDayProgress.toFixed(1)} / {BIZ_DAYS_PER_MONTH} 営業日
            </span>
          </div>
          <div className="mt-1 h-2 bg-bg-base border border-bg-card overflow-hidden">
            <div
              className="h-full bg-pachi-cyan transition-all"
              style={{ width: `${monthProgress}%` }}
            />
          </div>
        </div>

        <Section label="客数">
          <Item label="現在遊戯中" value={`${playingNow} 名`} />
          <Item label="今日の来店" value={shop.dailyCustomers.toLocaleString() + " 名"} />
          <Item label="累計来店" value={shop.totalCustomers.toLocaleString() + " 名"} />
          <Item
            label="今月の来店"
            value={stats.customers.toLocaleString() + " 名"}
          />
        </Section>

        <Section label="売上">
          <Item
            label="今日の売上"
            value={"¥" + todayRevenue.toLocaleString()}
            color="text-pachi-green"
          />
          <Item
            label="今月の売上"
            value={"¥" + Math.round(stats.revenue).toLocaleString()}
            color="text-pachi-green"
          />
        </Section>

        <Section label="今月の支出">
          <Item
            label="家賃"
            value={"¥" + Math.round(stats.rent).toLocaleString()}
            color="text-pachi-pink"
          />
          <Item
            label="電気代"
            value={"¥" + Math.round(stats.electric).toLocaleString()}
            color="text-pachi-pink"
          />
          <Item
            label="人件費"
            value={"¥" + Math.round(stats.labor).toLocaleString()}
            color="text-pachi-pink"
          />
          <Item
            label="修繕費"
            value={"¥" + Math.round(stats.repair).toLocaleString()}
          />
          <Item
            label="イベント費"
            value={"¥" + Math.round(stats.event).toLocaleString()}
          />
          <Item
            label="設備投資"
            value={"¥" + Math.round(stats.equipment).toLocaleString()}
          />
          <Item
            label="保管費"
            value={"¥" + Math.round(stats.storage).toLocaleString()}
          />
          <Item
            label="支出合計"
            value={"¥" + Math.round(expense).toLocaleString()}
            color="text-pachi-red"
          />
        </Section>

        <Section label="損益">
          <Item
            label="今月の利益"
            value={"¥" + Math.round(profit).toLocaleString()}
            color={profit >= 0 ? "text-pachi-green" : "text-pachi-red"}
          />
          <Item
            label={`店長Lv ${managerLevel} 節約額`}
            value={"¥" + managerSavings.toLocaleString()}
          />
          <Item
            label={`店長XP`}
            value={`${managerXp} / 100`}
          />
        </Section>

        {lastStats && (
          <div className="mt-3 pt-2 border-t border-bg-card">
            <p className="font-pixel text-[10px] text-white/60 mb-1">先月の実績</p>
            <Item
              label="売上"
              value={"¥" + Math.round(lastStats.revenue).toLocaleString()}
            />
            <Item
              label="支出"
              value={"¥" + Math.round(totalExpense(lastStats)).toLocaleString()}
              color="text-pachi-red"
            />
            <Item
              label="利益"
              value={"¥" + Math.round(monthProfit(lastStats)).toLocaleString()}
              color={
                monthProfit(lastStats) >= 0 ? "text-pachi-green" : "text-pachi-red"
              }
            />
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-bg-card flex justify-between items-baseline">
          <span className="font-pixel text-[10px] text-pachi-yellow">店の現金</span>
          <span className="font-pixel text-pachi-yellow text-sm">
            ¥{(user?.cash ?? 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="font-pixel text-[9px] text-white/50 mt-2 mb-1">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Item({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between text-[11px] py-0.5">
      <span className="text-white/60 font-dot">{label}</span>
      <span className={`font-pixel ${color}`}>{value}</span>
    </div>
  );
}
