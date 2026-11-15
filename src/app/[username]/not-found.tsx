import Link from "next/link";
import { SearchX } from "lucide-react";

/**
 * /[username] 에서 사용자를 찾지 못했을 때 보여주는 404 페이지
 */
export default function UsernameNotFound() {
  return (
    <div className="min-h-screen w-full bg-[#F2F3F8] px-4 flex items-center justify-center antialiased">
      <main className="max-w-sm w-full bg-white rounded-2xl border border-[#E5E8EF] p-8 shadow-xs flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[#F2F3F8] text-[#99A1B1] flex items-center justify-center">
          <SearchX className="w-6 h-6" />
        </div>
        <p className="text-4xl font-black text-[#CBD1DC] tracking-tight">404</p>
        <h1 className="text-lg font-bold text-[#141A24]">페이지를 찾을 수 없어요</h1>
        <p className="text-sm text-[#697383] leading-relaxed">
          입력한 주소의 사용자가 없거나 username이 변경되었을 수 있어요.
          <br />
          주소를 다시 확인해주세요.
        </p>
        <Link
          href="/"
          className="mt-2 h-11 px-5 rounded-[12px] bg-[#0078FF] hover:bg-[#0066DB] text-white text-sm font-semibold flex items-center justify-center transition socar-press active:scale-[0.97]"
        >
          MyLink 홈으로 가기
        </Link>
      </main>
    </div>
  );
}
