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
    const challengeWaitMs = opts.challengeWaitMs ?? 15000;
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

        // Cloudflare 챌린지 페이지("Just a moment...")면, 통과될 때까지 폴링
        const start = Date.now();
        while (Date.now() - start < challengeWaitMs) {
            const title = await page.title();
            if (!title.includes('Just a moment')) break;
            await new Promise(r => setTimeout(r, 1000));
        }

        const finalTitle = await page.title();
        const html = await page.content();

        if (finalTitle.includes('Just a moment')) {
            const snippet = html.slice(0, 500).replace(/\s+/g, ' ');
            throw new Error(
                `${challengeWaitMs}ms 동안 기다렸지만 Cloudflare 챌린지를 통과하지 못했습니다. ` +
                `(체크박스 클릭이 필요한 인터랙티브 Turnstile일 가능성) 응답 미리보기: ${snippet}`
            );
        }

        // 진단 로그: 파싱이 0건일 때 뭘 받았는지 바로 확인할 수 있도록 항상 남긴다
        console.log(`[headless] 최종 페이지 제목: "${finalTitle}", HTML 길이: ${html.length}`);

        return html;
    } finally {
        await browser.close();
    }
}
