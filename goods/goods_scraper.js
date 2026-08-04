import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * 상품 하나(remini, jota...)에 쇼핑몰을 여러 개 등록할 수 있습니다.
 * 아래처럼 같은 상품 키 안에 shop 키를 추가하기만 하면 자동으로 가격 비교 목록에 들어갑니다.
 *
 *   remini: {
 *       withmuu: { label: 'WITHMUU', url: '...', priceSelector: '.item_price', soldoutSelector: '.btn_soldout' },
 *       coupang: { label: '쿠팡',    url: '...', priceSelector: '.total-price', soldoutSelector: '.out-of-stock' },
 *   }
 */
const SCRAPE_CONFIG = {
    remini: {
        withmuu: { label: 'WITHMUU', url: "https://withmuu.com/goods/goods_view.php?goodsNo=1000014598", priceSelector: ".item_price", soldoutSelector: ".btn_soldout" }
    },
    jota: {
        kream: { label: 'KREAM', url: "https://kream.co.kr/products/985255", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    },
    ming: {
        kream: { label: 'KREAM', url: "https://kream.co.kr/products/985257", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    },
    ribbu: {
        kream: { label: 'KREAM', url: "https://kream.co.kr/products/985256", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    },
    jjaero: {
        kream: { label: 'KREAM', url: "https://kream.co.kr/products/985259", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    },
    yam: {
        kream: { label: 'KREAM', url: "https://kream.co.kr/products/985258", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function parsePriceToNumber(priceText) {
    if (!priceText) return null;
    const match = priceText.replace(/,/g, '').match(/\d{3,}/);
    return match ? Number(match[0]) : null;
}

async function scrapeOneShop(page, url, priceSelector, soldoutSelector) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(4000);

    await page.waitForSelector(priceSelector, { timeout: 5000 }).catch(() => null);
    const priceText = await page.$eval(priceSelector, el => el.innerText).catch(() => null);
    const priceNum = parsePriceToNumber(priceText);

    const isSoldOut = await page.evaluate((sel) => {
        if (document.querySelector(sel)) return true;
        const els = Array.from(document.querySelectorAll('button, a, span, div, input'));
        return els.some(el => {
            const t = (el.innerText || el.value || '').trim().toUpperCase();
            return t === 'SOLD OUT' || t === 'SOLDOUT' || t === '품절';
        });
    }, soldoutSelector);

    return { priceNum, stock: isSoldOut ? 'soldout' : 'available' };
}

async function scrapeGoods() {
    console.log("🤖 굿즈 가격 및 품절 유무 크롤링 시작...");

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const goodsData = {};

    for (const item of Object.keys(SCRAPE_CONFIG)) {
        const shopKeys = Object.keys(SCRAPE_CONFIG[item]);
        const shops = [];

        for (const shopKey of shopKeys) {
            const cfg = SCRAPE_CONFIG[item][shopKey];
            console.log(`[${item} - ${shopKey}] 페이지 접속 중...`);
            try {
                const { priceNum, stock } = await scrapeOneShop(page, cfg.url, cfg.priceSelector, cfg.soldoutSelector);
                console.log(` > 가격: ${priceNum ?? '확인 실패'} / 상태: ${stock}`);
                shops.push({
                    shop: shopKey,
                    label: cfg.label || shopKey,
                    url: cfg.url,
                    priceNum,
                    price: priceNum != null ? `₩ ${priceNum.toLocaleString('ko-KR')}` : null,
                    stock
                });
            } catch (e) {
                console.error(`[${item} - ${shopKey}] 크롤링 에러: ${e.message}`);
                shops.push({ shop: shopKey, label: cfg.label || shopKey, url: cfg.url, priceNum: null, price: null, stock: 'unknown' });
            }
            await delay(500);
        }

        // 가격이 확인된 것들 중 가장 싼 곳을 자동으로 표시 (재고 있는 곳 우선, 없으면 전체 중 최저가)
        const withPrice = shops.filter(s => s.priceNum != null);
        const inStockWithPrice = withPrice.filter(s => s.stock === 'available');
        const pool = inStockWithPrice.length ? inStockWithPrice : withPrice;
        const cheapest = pool.length ? pool.reduce((a, b) => (a.priceNum <= b.priceNum ? a : b)).shop : null;

        goodsData[item] = { shops, cheapest };
    }

    await browser.close();

    const savePath = 'goods/goods_data.json';
    fs.writeFileSync(savePath, JSON.stringify(goodsData, null, 4), 'utf-8');
    console.log(`✅ 데이터가 [${savePath}]에 저장되었습니다.`);
}

scrapeGoods();
