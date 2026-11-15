import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getPublicPage } from "@/lib/publicProfile";
import { CategoryIcon } from "@/components/icons";
import { TrackedLink } from "@/components/TrackedLink";

/**
 * 공개 링크 페이지: /{username}
 * - URL의 username → usernames/{username} → uid → users/{uid}/profile/main, users/{uid}/links
 * - 사용자를 찾지 못하면 notFound() → 같은 폴더의 not-found.tsx (HTTP 404)
 */
export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const page = await getPublicPage(username);
  if (!page) return { title: "페이지를 찾을 수 없습니다 | MyLink" };

  const { displayName, bio } = page.profile;
  return {
    title: `${displayName} (@${page.profile.username}) | MyLink`,
    description: bio || `${displayName}님의 링크 모음 페이지입니다.`,
  };
}

export default async function PublicProfilePage({ params }: PageProps<"/[username]">) {
  // 1. URL에서 username 추출
  const { username } = await params;

  // 2~3. username으로 사용자 찾기 → 해당 uid의 링크 조회
  const page = await getPublicPage(username);

  // 5. 찾지 못하면 404
  if (!page) notFound();

  const { uid, profile, links } = page;

  // 4. 프로필 카드 + 링크 리스트
  return (
    <div className="min-h-screen w-full bg-[#F2F3F8] text-[#354153] px-4 py-10 antialiased">
      <main className="max-w-md mx-auto flex flex-col gap-5">
        {/* 상단: 프로필 카드 */}
        <section className="bg-white rounded-2xl border border-[#E5E8EF] px-6 py-8 shadow-xs flex flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0078FF] to-[#5B5FC7] text-white text-3xl font-bold flex items-center justify-center shadow-sm"
          >
            {profile.displayName.slice(0, 1).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-bold text-[#141A24] tracking-tight break-all">
            {profile.displayName}
          </h1>
          <p className="mt-0.5 text-[13px] font-semibold text-[#0078FF]">@{profile.username}</p>
          {profile.bio ? (
            <p className="mt-3 text-sm text-[#4A5667] leading-relaxed whitespace-pre-line break-words">
              {profile.bio}
            </p>
          ) : null}
        </section>

        {/* 하단: 링크 리스트 (버튼 형태) */}
        <section aria-label="링크 목록" className="flex flex-col gap-3">
          {links.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CBD1DC] bg-white/60 p-8 text-center text-sm text-[#99A1B1]">
              아직 공개된 링크가 없습니다.
            </div>
          ) : (
            links.map((link) => (
              <TrackedLink
                key={link.id}
                ownerUid={uid}
                linkId={link.id}
                href={link.url}
                className={`group w-full min-h-14 rounded-[14px] border px-4 py-3 flex items-center gap-3 shadow-xs transition socar-press active:scale-[0.98] ${
                  link.isFeatured
                    ? "bg-[#0078FF] border-[#0078FF] text-white hover:bg-[#0066DB]"
                    : "bg-white border-[#E5E8EF] text-[#141A24] hover:border-[#0078FF] hover:bg-[#F7FAFF]"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                    link.isFeatured ? "bg-white/20 text-white" : "bg-[#EBF5FF] text-[#0078FF]"
                  }`}
                >
                  <CategoryIcon category={link.category} icon={link.icon} className="w-[18px] h-[18px]" />
                </span>
                <span className="flex-1 min-w-0 text-left">
                  <span className="block text-[15px] font-semibold truncate">{link.title}</span>
                  {link.description ? (
                    <span
                      className={`block text-xs truncate mt-0.5 ${
                        link.isFeatured ? "text-white/80" : "text-[#697383]"
                      }`}
                    >
                      {link.description}
                    </span>
                  ) : null}
                </span>
                <ExternalLink
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 transition ${
                    link.isFeatured ? "text-white/80" : "text-[#99A1B1] group-hover:text-[#0078FF]"
                  }`}
                />
              </TrackedLink>
            ))
          )}
        </section>

        <footer className="pt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#99A1B1] hover:text-[#0078FF] transition"
          >
            <span className="w-4 h-4 rounded-[4px] bg-[#0078FF] text-white text-[8px] font-black flex items-center justify-center">
              ML
            </span>
            MyLink로 나만의 링크 페이지 만들기
          </Link>
        </footer>
      </main>
    </div>
  );
}
