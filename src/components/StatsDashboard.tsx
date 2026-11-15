"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { BarChart3, ExternalLink, Link2, MousePointerClick, Trophy } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAuthStore, getDefaultUsername } from "@/lib/authStore";
import { useLinksQuery, useProfileQuery } from "@/lib/queries";
import { getPublicUrl } from "@/lib/publicUrl";
import { LINK_CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";

/** 링크별 클릭 막대 차트에 표시할 최대 개수 */
const TOP_LINKS = 8;

const linkChartConfig = {
  clicks: { label: "클릭", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** 카테고리별 도넛 차트 색상 */
const CATEGORY_COLORS: Record<string, string> = {
  PORTFOLIO: "var(--chart-1)",
  WEBSITE: "var(--chart-2)",
  ETC: "var(--chart-4)",
};

const categoryChartConfig = {
  clicks: { label: "클릭" },
  ...Object.fromEntries(
    LINK_CATEGORIES.map((c) => [c.value, { label: c.label, color: CATEGORY_COLORS[c.value] }])
  ),
} satisfies ChartConfig;

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * 통계 화면 (/stats)
 * - 총 클릭 수(모든 링크 합산) + 요약 지표
 * - 링크별 클릭 수(막대), 카테고리별 클릭 비율(도넛) - shadcn/ui Chart(Recharts)
 * - 링크 클릭 순위
 * 데이터는 링크 관리와 같은 TanStack Query 캐시(Firestore 실시간 구독)라 방문자가 클릭하면 바로 갱신된다.
 */
export function StatsDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfileQuery();
  const linksQuery = useLinksQuery();
  const links = useMemo(() => linksQuery.data ?? [], [linksQuery.data]);

  const stats = useMemo(() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
    const ranked = [...links].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
    const byCategory = LINK_CATEGORIES.map((c) => ({
      category: c.value,
      clicks: links
        .filter((l) => l.category === c.value)
        .reduce((sum, l) => sum + (l.clickCount || 0), 0),
      fill: `var(--color-${c.value})`,
    }));
    return {
      totalClicks,
      publicCount: links.filter((l) => l.isActive).length,
      average: links.length > 0 ? totalClicks / links.length : 0,
      top: ranked[0] && (ranked[0].clickCount || 0) > 0 ? ranked[0] : null,
      ranked,
      linkChartData: ranked.slice(0, TOP_LINKS).map((l) => ({
        title: l.title,
        clicks: l.clickCount || 0,
      })),
      byCategory,
    };
  }, [links]);

  if (!user) return null;

  if (linksQuery.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-36 rounded-[20px] bg-white border border-[#E5E8EF] animate-pulse" />
        <div className="h-72 rounded-[20px] bg-white border border-[#E5E8EF] animate-pulse" />
      </div>
    );
  }

  if (linksQuery.isError) {
    return (
      <div className="rounded-[16px] border border-[#FFD1DA] bg-[#FFF0F3] p-6 text-center text-[13px] text-[#FF3A5B] font-semibold">
        통계를 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 새로고침해주세요.
      </div>
    );
  }

  const username = profile?.username ?? getDefaultUsername(user);
  const hasClicks = stats.totalClicks > 0;

  if (links.length === 0) {
    return (
      <EmptyCard
        icon={<Link2 className="w-5 h-5" />}
        title="아직 링크가 없어요"
        description="링크를 추가하고 공개 페이지를 공유하면 클릭 통계가 여기에 표시돼요."
        action={
          <Link
            href="/"
            className="mt-2 h-9 px-4 rounded-full bg-[#141A24] text-white text-[13px] font-semibold flex items-center"
          >
            링크 추가하러 가기
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 총 클릭 수 */}
      <section className="rounded-[20px] bg-[#0078FF] text-white p-6 flex items-center justify-between gap-4 shadow-[0_8px_24px_rgba(0,120,255,0.2)]">
        <div>
          <p className="text-[13px] font-semibold text-white/80 flex items-center gap-1.5">
            <MousePointerClick className="w-4 h-4" />
            총 클릭 수
          </p>
          <p className="mt-1 text-[40px] leading-none font-bold tabular-nums tracking-tight">
            {stats.totalClicks.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-white/70">링크 {links.length}개의 클릭 수 합계 · 실시간 반영</p>
        </div>
        <a
          href={getPublicUrl(username)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 h-9 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-[13px] font-semibold flex items-center gap-1.5 transition"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden min-[400px]:inline">공개 페이지</span>
        </a>
      </section>

      {/* 요약 지표 */}
      <dl className="grid grid-cols-3 gap-2">
        <Kpi label="공개 링크" value={`${stats.publicCount}/${links.length}`} />
        <Kpi label="링크당 평균" value={stats.average.toLocaleString(undefined, { maximumFractionDigits: 1 })} />
        <Kpi
          label="최다 클릭"
          value={stats.top ? truncate(stats.top.title, 10) : "-"}
          title={stats.top ? `${stats.top.title} (${stats.top.clickCount}회)` : undefined}
          small
        />
      </dl>

      {!hasClicks ? (
        <EmptyCard
          icon={<BarChart3 className="w-5 h-5" />}
          title="아직 클릭이 없어요"
          description="방문자가 공개 페이지에서 링크를 누르면 차트로 보여드릴게요."
        />
      ) : (
        <>
          {/* 링크별 클릭 수 */}
          <ChartCard title="링크별 클릭 수" description={`클릭이 많은 순 상위 ${Math.min(TOP_LINKS, links.length)}개`}>
            <ChartContainer
              config={linkChartConfig}
              className="w-full"
              style={{ height: Math.max(160, stats.linkChartData.length * 44) }}
            >
              <BarChart
                accessibilityLayer
                data={stats.linkChartData}
                layout="vertical"
                margin={{ left: 0, right: 16 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" dataKey="clicks" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={96}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => truncate(v, 8)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="clicks" fill="var(--color-clicks)" radius={6} barSize={24} />
              </BarChart>
            </ChartContainer>
          </ChartCard>

          {/* 카테고리별 클릭 비율 */}
          <ChartCard title="카테고리별 클릭" description="카테고리별 클릭 비율">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ChartContainer config={categoryChartConfig} className="aspect-square w-full max-w-[220px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="category" />} />
                  <Pie
                    data={stats.byCategory.filter((c) => c.clicks > 0)}
                    dataKey="clicks"
                    nameKey="category"
                    innerRadius={60}
                    strokeWidth={4}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-[#141A24] text-2xl font-bold">
                              {stats.totalClicks.toLocaleString()}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} className="fill-[#99A1B1] text-xs">
                              총 클릭
                            </tspan>
                          </text>
                        );
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <ul className="w-full flex flex-col gap-2">
                {stats.byCategory.map((c) => {
                  const share = stats.totalClicks > 0 ? (c.clicks / stats.totalClicks) * 100 : 0;
                  return (
                    <li key={c.category} className="flex items-center gap-2.5 text-[13px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[c.category] }}
                        aria-hidden="true"
                      />
                      <span className="text-[#354153] font-medium">{CATEGORY_LABELS[c.category]}</span>
                      <span className="ml-auto tabular-nums font-semibold text-[#141A24]">
                        {c.clicks.toLocaleString()}
                      </span>
                      <span className="w-12 text-right tabular-nums text-[#99A1B1]">{share.toFixed(0)}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </ChartCard>
        </>
      )}

      {/* 링크 클릭 순위 */}
      <ChartCard title="링크 클릭 순위" description="전체 링크 (비공개 포함)">
        <ol className="flex flex-col divide-y divide-[#F2F3F8]">
          {stats.ranked.map((link, index) => {
            const clicks = link.clickCount || 0;
            const share = stats.totalClicks > 0 ? (clicks / stats.totalClicks) * 100 : 0;
            return (
              <li key={link.id} className="py-2.5 flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                    index === 0 && clicks > 0 ? "bg-[#0078FF] text-white" : "bg-[#F2F3F8] text-[#697383]"
                  }`}
                >
                  {index === 0 && clicks > 0 ? <Trophy className="w-3 h-3" /> : index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[13px] font-semibold text-[#141A24] truncate">{link.title}</span>
                    {!link.isActive && (
                      <span className="shrink-0 text-[10px] font-bold text-[#697383] bg-[#F2F3F8] px-1.5 py-0.5 rounded-full">
                        비공개
                      </span>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[#F2F3F8] overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full bg-[#0078FF]" style={{ width: `${share}%` }} />
                  </div>
                </div>
                <span className="w-16 text-right text-[13px] font-semibold tabular-nums text-[#141A24]">
                  {clicks.toLocaleString()}
                  <span className="text-[#99A1B1] font-normal">회</span>
                </span>
              </li>
            );
          })}
        </ol>
      </ChartCard>
    </div>
  );
}

function Kpi({ label, value, title, small }: { label: string; value: string; title?: string; small?: boolean }) {
  return (
    <div className="rounded-[16px] bg-white border border-[#E5E8EF] px-3 py-3 min-w-0" title={title}>
      <dt className="text-[11px] text-[#99A1B1]">{label}</dt>
      <dd
        className={`mt-0.5 font-bold text-[#141A24] truncate tabular-nums ${small ? "text-[15px] leading-7" : "text-xl"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] bg-white border border-[#E5E8EF] p-5 sm:p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-[15px] font-bold text-[#141A24]">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-[#99A1B1]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-dashed border-[#CBD1DC] bg-white px-6 py-10 flex flex-col items-center text-center gap-2">
      <span className="w-11 h-11 rounded-full bg-[#EBF5FF] text-[#0078FF] flex items-center justify-center">
        {icon}
      </span>
      <p className="text-[15px] font-semibold text-[#141A24]">{title}</p>
      <p className="text-[13px] text-[#697383]">{description}</p>
      {action}
    </section>
  );
}
