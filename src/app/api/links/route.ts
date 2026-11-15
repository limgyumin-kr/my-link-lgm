import { NextResponse, type NextRequest } from "next/server";
import mockData from "@/data/mock-links.json";
import { getLinksFromFirestore } from "@/lib/firestoreLinks";
import { LinkItem } from "@/types/link";

/**
 * GET /api/links?uid={uid}
 * 쿼리 파라미터 지원:
 * - uid: (필수) 조회할 사용자 uid → Firestore users/{uid}/links
 * - category: PORTFOLIO | WEBSITE | ETC | ALL
 * - activeOnly: boolean (true일 경우 활성화된 링크만 반환)
 *
 * Firestore users/{uid}/links 경로의 링크만 반환합니다. (데모 목데이터 링크는 병합하지 않음)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        {
          status: "error",
          statusCode: 400,
          message: "uid 쿼리 파라미터가 필요합니다. (예: /api/links?uid=...)",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    let firestoreLinks: LinkItem[] = [];
    try {
      firestoreLinks = await getLinksFromFirestore(uid);
    } catch (e) {
      console.warn("API GET /api/links firestore fetch skipped/failed:", e);
    }

    let links = [...firestoreLinks];

    // 활성 상태 필터링
    if (activeOnly) {
      links = links.filter((item) => item.isActive);
    }

    // 카테고리 필터링
    if (category && category !== "ALL") {
      links = links.filter((item) => item.category === category);
    }

    // 정렬: 1순위 Featured, 2순위 order 오름차순
    links.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.order - b.order;
    });

    return NextResponse.json({
      status: "success",
      statusCode: 200,
      message: "링크 목록을 성공적으로 조회했습니다.",
      data: {
        ...mockData.data,
        links,
        pagination: {
          ...mockData.data.pagination,
          total: links.length,
          page: 1,
          limit: 10,
          totalPages: Math.max(1, Math.ceil(links.length / 10)),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        statusCode: 500,
        message: "링크 목록을 불러오는 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/links
 * 링크는 users/{uid}/links 에 저장되며, 로그인한 본인만 추가할 수 있어야 한다.
 * 서버 API에는 로그인 정보가 없어 본인 확인이 불가능하므로 비활성화하고,
 * 클라이언트(Firebase Auth 로그인 상태)에서 직접 Firestore에 저장한다.
 */
export async function POST() {
  return NextResponse.json(
    {
      status: "error",
      statusCode: 405,
      message: "링크 추가는 Google 로그인 후 화면에서만 가능합니다.",
      timestamp: new Date().toISOString(),
    },
    { status: 405, headers: { Allow: "GET" } }
  );
}
