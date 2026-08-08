import puppeteer from 'puppeteer';
import fs from 'fs';
const DATA_PATH = 'goods/goods_data.json';

const SHOP_SELECTORS = {
    withmuu: {
        priceSelector: '.item_price',
        soldoutCheck: (page) => page.evaluate(() => {
            if (document.querySelector('.btn_soldout')) return true;
            const img = document.querySelector('img[alt="품절"]');
            if (img) return true;
            return /품절/.test(document.body.innerText || '');
        })
    },
    ktown4u: {
        priceSelector: '.text-s1, [class*="text-s1"]',
        soldoutCheck: (page) => page.evaluate(() => /품절/.test(document.body.innerText || ''))
    },
    kream: {
        priceSelector: '.amount, [class*="amount"]',
        soldoutCheck: (page) => page.evaluate(() => {
            if (document.querySelector('.btn_soldout')) return true;
            return /품절|판매중지|SOLD ?OUT/i.test(document.body.innerText || '');
        })
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function parsePriceToNumber(priceText) {
    if (!priceText) return null;
    const match = priceText.replace(/,/g, '').match(/\d{3,}/);
    return match ? Number(match[0]) : null;
}

async function scrapeOneShop(page, shopKey, url) {
    const cfg = SHOP_SELECTORS[shopKey];
    if (!cfg) throw new Error(`알 수 없는 쇼핑몰 타입: ${shopKey}`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(4000); // SPA(ktown4u/kream)는 클라이언트 렌더링 대기 필요

    await page.waitForSelector(cfg.priceSelector, { timeout: 6000 }).catch(() => null);
    const priceText = await page.$eval(cfg.priceSelector, el => el.innerText).catch(() => null);
    const priceNum = parsePriceToNumber(priceText);
    const isSoldOut = await cfg.soldoutCheck(page).catch(() => false);

    return { priceNum, stock: isSoldOut ? 'soldout' : 'available' };
}

async function scrapeGoods() {
    console.log("🤖 굿즈 가격 및 품절 유무 크롤링 시작...");

    if (!fs.existsSync(DATA_PATH)) {
        console.error(`❌ ${DATA_PATH} 가 없습니다.`);
        return;
    }
    const goodsData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const itemKey of Object.keys(goodsData)) {
        const item = goodsData[itemKey];
        if (!item.shops || !item.shops.length) continue;

        for (const shop of item.shops) {
            console.log(`[${itemKey} - ${shop.shop}] 접속 중... ${shop.url}`);
            try {
                const { priceNum, stock } = await scrapeOneShop(page, shop.shop, shop.url);
                console.log(`  > 가격: ${priceNum ?? '확인 실패'} / 상태: ${stock}`);
                shop.priceNum = priceNum;
                shop.price = priceNum != null ? `₩ ${priceNum.toLocaleString('ko-KR')}` : shop.price ?? null;
                shop.stock = priceNum != null ? stock : (shop.stock || 'unknown');
            } catch (e) {
                console.error(`  ✗ [${itemKey} - ${shop.shop}] 크롤링 에러: ${e.message}`);
                // 실패 시 기존 값 유지 (전면 덮어쓰지 않음 — 일시적 네트워크 오류로 데이터 날아가는 것 방지)
            }
            await delay(600);
        }

        // 재고 있는 곳 중 최저가를 자동으로 cheapest 로 지정 (없으면 전체 중 최저가)
        const withPrice = item.shops.filter(s => s.priceNum != null);
        const inStockWithPrice = withPrice.filter(s => s.stock === 'available');
        const pool = inStockWithPrice.length ? inStockWithPrice : withPrice;
        item.cheapest = pool.length ? pool.reduce((a, b) => (a.priceNum <= b.priceNum ? a : b)).shop : item.cheapest;
        item.soldout = item.shops.length > 0 && item.shops.every(s => s.stock === 'soldout');
    }

    await browser.close();

    fs.writeFileSync(DATA_PATH, JSON.stringify(goodsData, null, 2), 'utf-8');
    console.log(`✅ 데이터가 [${DATA_PATH}]에 저장되었습니다. (총 ${Object.keys(goodsData).length}개 상품)`);
}

scrapeGoods();
