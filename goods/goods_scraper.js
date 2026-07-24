import puppeteer from 'puppeteer';
import fs from 'fs';

// ⭐️ remini는 withmuu 1개, 나머지는 kream 1개만 돌도록 완벽하게 분리했습니다.
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
    
    // 크롤링 차단 방지용
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // ⭐️ 저장할 데이터 뼈대도 딱 각자 들어갈 1곳씩만 남겼습니다.
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
        
        // 각 멤버에 할당된 쇼핑몰(1개)만 가져옴
        const shops = Object.keys(SCRAPE_CONFIG[member]);

        for (const shop of shops) {
            const config = SCRAPE_CONFIG[member][shop];

            try {
                console.log(`[${member} - ${shop}] 페이지 접속 중...`);
                await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                
                await delay(3000); 

                // 1. 가격 긁어오기
                if (!priceSet) {
                    await page.waitForSelector(config.priceSelector, { timeout: 5000 }).catch(() => null);
                    const priceText = await page.$eval(config.priceSelector, el => el.innerText).catch(() => null);
                    
                    if (priceText && priceText.trim() !== "") {
                        let cleanText = priceText.trim().split('\n')[0]; 
                        if (!cleanText.includes('₩') && !cleanText.includes('원')) {
                            cleanText = `₩ ${cleanText}`;
                        }
                        goodsData[member].price = cleanText;
                        priceSet = true;
                    }
                }

                // 2. 품절 마크 긁어오기
                const isSoldOut = await page.$(config.soldoutSelector); 
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
    
    // JSON 파일 저장
    const savePath = 'goods/goods_data.json';
    fs.writeFileSync(savePath, JSON.stringify(goodsData, null, 4), 'utf-8');
    console.log(`✅ 크롤링 완료! 데이터가 [${savePath}]에 저장되었습니다.`);
}

scrapeGoods();
