import puppeteer from 'puppeteer';
import fs from 'fs';

const SCRAPE_CONFIG = {
    remini: {
        withmuu: { url: "https://withmuu.com/goods/goods_view.php?goodsNo=1000014598", priceSelector: ".item_price", soldoutSelector: ".btn_soldout" }
    },
    jota: {
        kream: { url: "https://kream.co.kr/products/985255", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    },
    ming: {
        kream: { url: "https://kream.co.kr/products/985257", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    },
    ribbu: {
        kream: { url: "https://kream.co.kr/products/985256", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    },
    jjaero: {
        kream: { url: "https://kream.co.kr/products/985259", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    },
    yam: {
        kream: { url: "https://kream.co.kr/products/985258", priceSelector: ".amount", soldoutSelector: ".btn_soldout" }
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeGoods() {
    console.log("🤖 굿즈 가격 및 품절 유무 크롤링 시작...");

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const goodsData = {
        "remini": { "price": "", "withmuu": "available" },
        "jota": { "price": "", "kream": "available" },
        "ming": { "price": "", "kream": "available" },
        "ribbu": { "price": "", "kream": "available" },
        "jjaero": { "price": "", "kream": "available" },
        "yam": { "price": "", "kream": "available" }
    };

    const members = Object.keys(SCRAPE_CONFIG);

    for (const member of members) {
        let priceSet = false; 
    
        const shops = Object.keys(SCRAPE_CONFIG[member]);

        for (const shop of shops) {
            const config = SCRAPE_CONFIG[member][shop];

            try {
                console.log(`[${member} - ${shop}] 페이지 접속 중...`);
                await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                
                await delay(4000); 

                if (!priceSet) {
                    await page.waitForSelector(config.priceSelector, { timeout: 5000 }).catch(() => null);
                    const priceText = await page.$eval(config.priceSelector, el => el.innerText).catch(() => null);

                    if (priceText) {
                        const match = priceText.replace(/,/g, '').match(/\d{3,}/);
                        if (match) {
                            const num = Number(match[0]).toLocaleString('ko-KR');
                            goodsData[member].price = `₩ ${num}`;
                            priceSet = true;
                        }
                    }
                }

                const isSoldOut = await page.evaluate((sel) => {
                    if (document.querySelector(sel)) return true;
                    const els = Array.from(document.querySelectorAll('button, a, span, div, input'));
                    return els.some(el => {
                        const t = (el.innerText || el.value || '').trim().toUpperCase();
                        return t === 'SOLD OUT' || t === 'SOLDOUT' || t === '품절';
                    });
                }, config.soldoutSelector);

                if (isSoldOut) {
                    goodsData[member][shop] = "soldout";
                    console.log(` > 상태: 품절`);
                } else {
                    goodsData[member][shop] = "available";
                    console.log(` > 상태: 구매 가능`);
                }

            } catch (e) {
                console.error(`[${member} - ${shop}] 크롤링 에러 발생!`);
                goodsData[member][shop] = "available"; 
            }
        }

        if (!priceSet) {
            goodsData[member].price = "₩ 45,000"; 
        }
    }

    await browser.close();
    
    const savePath = 'goods/goods_data.json';
    fs.writeFileSync(savePath, JSON.stringify(goodsData, null, 4), 'utf-8');
    console.log(`✅ 데이터가 [${savePath}]에 저장되었습니다.`);
}

scrapeGoods();
