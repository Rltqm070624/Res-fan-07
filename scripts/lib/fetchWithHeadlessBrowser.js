import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

// GitHub Actions ubuntu-latest 러너에는 Google Chrome이 기본 설치되어 있음.
// puppeteer-core는 자체 Chromium을 받지 않으므로, 시스템에 이미 있는 Chrome을 찾아 쓴다.
const CANDIDATE_PATHS = [
    process.env.CHROME_PATH, // 워크플로에서 명시적으로 지정 가능
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
].filter(Boolean);

function resolveChromePath() {
    for (const p of CANDIDATE_PATHS) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error(
        `Chrome 실행 파일을 찾을 수 없습니다. 확인한 경로: ${CANDIDATE_PATHS.join(', ')}\n` +
        `CHROME_PATH 환경변수로 직접 지정해주세요.`
    );
}

/**
 * 헤드리스 Chrome(스텔스 패치)으로 페이지를 렌더링해 HTML을 가져온다.
 * Cloudflare의 "Just a moment..." 같은 인터랙티브 JS 챌린지를 실제로 통과시키기 위함.
 *
 * @param {string} url
 * @param {object} opts
 * @param {number} opts.challengeWaitMs - 챌린지 통과 대기 시간 (기본 15초)
 * @returns {Promise<string>} 렌더링된 HTML
 */
export async function fetchHtmlViaHeadlessBrowser(url, opts = {}) {
    const challengeWaitMs = opts.challengeWaitMs ?? 20000;
    const executablePath = resolveChromePath();

    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--lang=ko-KR',
        ],
    });

    try {
        const page = await browser.newPage();
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
        await page.setViewport({ width: 1366, height: 900 });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        // 챌린지 제목은 Accept-Language에 따라 "Just a moment..." / "잠시만 기다리십시오…" 등으로
        // 언어가 바뀌므로 제목 문자열로 판정하지 않는다. 대신 실제 위키 콘텐츠(표)가
        // DOM에 나타났는지를 기준으로, 나타날 때까지 폴링한다.
        const deadline = Date.now() + challengeWaitMs;
        let hasContent = false;
        while (Date.now() < deadline) {
            hasContent = await page.evaluate(() => document.querySelector('table') !== null);
            if (hasContent) break;
            await new Promise(r => setTimeout(r, 1000));
        }

        const finalTitle = await page.title();
        const html = await page.content();

        if (!hasContent) {
            const snippet = html.slice(0, 500).replace(/\s+/g, ' ');
            throw new Error(
                `${challengeWaitMs}ms 동안 기다렸지만 실제 콘텐츠(표)가 나타나지 않았습니다. ` +
                `(체크박스 클릭이 필요한 인터랙티브 Turnstile이거나, 그 외 차단 페이지일 가능성) ` +
                `최종 제목: "${finalTitle}" / 응답 미리보기: ${snippet}`
            );
        }

        // 진단 로그: 파싱이 0건일 때 뭘 받았는지 바로 확인할 수 있도록 항상 남긴다
        console.log(`[headless] 최종 페이지 제목: "${finalTitle}", HTML 길이: ${html.length}`);

        return html;
    } finally {
        await browser.close();
    }
}
