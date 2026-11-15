/**
 * URL 정규화 및 엄격한 유효성 검증 유틸리티
 */

// http:// 또는 https:// 누락 시 자동으로 https:// 추가
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  errorMessage?: string;
}

/**
 * 올바른 도메인 및 웹 URL 정규식 패턴
 * - localhost[:port]
 * - IPv4 주소 (예: 127.0.0.1:3000)
 * - 일반 도메인 (최소 2글자 이상의 유효한 TLD 필요, 예: .com, .kr, .org, .dev, .io 등)
 */
const URL_REGEX =
  /^(https?:\/\/)?((([a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]\.)+[a-zA-Z]{2,})|localhost|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(:\d{1,5})?(\/[^\s]*)?$/i;

export function validateUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();

  // 1. 빈칸 검증
  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: "",
      errorMessage: "웹 주소(URL)를 입력해주세요.",
    };
  }

  // 2. 공백 포함 검사
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      errorMessage: "URL에는 공백이 포함될 수 없습니다.",
    };
  }

  // 3. 프로토콜 검사 (있다면 http 또는 https만 허용)
  if (/^[a-zA-Z]+:\/\//i.test(trimmed)) {
    if (!/^https?:\/\//i.test(trimmed)) {
      return {
        isValid: false,
        normalizedUrl: trimmed,
        errorMessage: "http:// 또는 https:// 프로토콜만 지원합니다.",
      };
    }
  }

  // 4. 정규식 패턴 검사
  if (!URL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      errorMessage: "올바른 웹 주소 형식(예: github.com 또는 https://example.com)을 입력해주세요.",
    };
  }

  const normalized = normalizeUrl(trimmed);

  // 5. WHATWG URL 파서 검증
  try {
    const parsed = new URL(normalized);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        isValid: false,
        normalizedUrl: normalized,
        errorMessage: "http:// 또는 https:// 주소만 입력 가능합니다.",
      };
    }

    const host = parsed.hostname;
    // 도메인 또는 호스트 유효성 추가 확인
    if (!host || host.startsWith(".") || host.endsWith(".") || host.includes("..")) {
      return {
        isValid: false,
        normalizedUrl: normalized,
        errorMessage: "올바른 도메인 주소 형식이 아닙니다.",
      };
    }

    // localhost 및 IP가 아닌 일반 도메인의 경우 TLD 검증
    const isIpOrLocalhost = host === "localhost" || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
    if (!isIpOrLocalhost) {
      const parts = host.split(".");
      const tld = parts[parts.length - 1];
      if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
        return {
          isValid: false,
          normalizedUrl: normalized,
          errorMessage: "유효한 최상위 도메인(예: .com, .kr, .io)을 포함해야 합니다.",
        };
      }
    }

    return {
      isValid: true,
      normalizedUrl: normalized,
    };
  } catch {
    return {
      isValid: false,
      normalizedUrl: normalized,
      errorMessage: "올바른 웹 주소 형식이 아닙니다.",
    };
  }
}
