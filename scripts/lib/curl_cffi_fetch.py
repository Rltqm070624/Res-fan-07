import sys

def main():
    if len(sys.argv) < 2:
        print("사용법: python3 curl_cffi_fetch.py <url>", file=sys.stderr)
        sys.exit(2)

    url = sys.argv[1]

    try:
        from curl_cffi import requests
    except ImportError:
        print(
            "❌ curl_cffi가 설치되어 있지 않습니다. "
            "GitHub Actions 워크플로에 'pip install curl_cffi' 스텝이 있는지 확인하세요.",
            file=sys.stderr,
        )
        sys.exit(2)

    try:
        res = requests.get(
            url,
            impersonate="chrome",  # 항상 최신 Chrome 지문 사용
            headers={
                "Accept-Language": "ko-KR,ko;q=0.9",
            },
            timeout=30,
        )
    except Exception as e:
        print(f"❌ 요청 자체가 실패했습니다: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"[curl_cffi] HTTP {res.status_code} ({url})", file=sys.stderr)

    if res.status_code >= 400:
        # 차단 유형을 다음에 진단할 수 있도록 응답 본문 일부를 stderr에 남긴다
        snippet = res.text[:500].replace("\n", " ")
        print(f"[curl_cffi] 응답 본문 미리보기: {snippet}", file=sys.stderr)
        print(f"❌ HTTP {res.status_code}", file=sys.stderr)
        sys.exit(1)

    # 성공 시 본문은 stdout으로만 출력 (Node에서 캡처)
    sys.stdout.write(res.text)
    sys.exit(0)


if __name__ == "__main__":
    main()
