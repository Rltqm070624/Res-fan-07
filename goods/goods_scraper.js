import puppeteer from 'puppeteer';
import fs from 'fs';

// ⭐️ 1. 여기에 실제 긁어올 사이트 링크와 설정값을 다 적어두면 봇이 알아서 순회합니다.
const SCRAPE_CONFIG = {
    jota: {
        kream: { url: "https://kream.co.kr/products/985255", priceSelector: ".price", soldoutSelector: ".btn_soldout" },
        everline: { url: "https://everline.com/jota_주소", priceSelector: ".price", soldoutSelector: ".soldout_mark" },
        soundwave: { url: "https://soundwave.com/jota_주소", priceSelector: ".price", soldoutSelector: ".soldout_icon" }
    },
    ming: {
        kream: { url: "https://kream.co.kr/products/985257", priceSelector: ".price", soldoutSelector: ".btn_soldout" },
        everline: { url: "https://everline.com/ming_주소", priceSelector: ".price", soldoutSelector: ".soldout_mark" },
        soundwave: { url: "https://soundwave.com/ming_주소", priceSelector: ".price", soldoutSelector: ".soldout_icon" }
    },
    ribbu: {
        kream: { url: "https://kream.co.kr/products/985256", priceSelector: ".price", soldoutSelector: ".btn_soldout" },
        everline: { url: "https://everline.com/ribbu_주소", priceSelector: ".price", soldoutSelector: ".soldout_mark" },
        soundwave: { url: "https://soundwave.com/ribbu_주소", priceSelector: ".price", soldoutSelector: ".soldout_icon" }
    },
    jjaero: {
        kream: { url: "https://kream.co.kr/products/985259", priceSelector: ".price", soldoutSelector: ".btn_soldout" },
        everline: { url: "https://everline.com/jjaero_주소", priceSelector: ".price", soldoutSelector: ".soldout_mark" },
        soundwave: { url: "https://soundwave.com/jjaero_주소", priceSelector: ".price", soldoutSelector: ".soldout_icon" }
    },
    yam: {
        kream: { url: "https://kream.co.kr/products/985258", priceSelector: ".price", soldoutSelector: ".btn_soldout" },
        everline: { url: "https://everline.com/yam_주소", priceSelector: ".price", soldoutSelector: ".soldout_mark" },
        soundwave: { url: "https://soundwave.com/yam_주소", priceSelector: ".price", soldoutSelector: ".soldout_icon" }
    }
};

// 시간 지연 함수 (봇 차단 방지용)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeGoods() {
    console.log("🤖 굿즈 가격 및 품절 유무 크롤링 시작...");

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // 크롤링 차단 방지용 가짜 유저 세팅
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // ⭐️ 2. 봇이 저장할 데이터 뼈대 (HTML과 맞추기 위해 weverse라는 키를 그대로 씀)
    const goodsData = {
        "jota": { "price": "", "weverse": "available", "everline": "available", "soundwave": "available" },
        "ming": { "price": "", "weverse": "available", "everline": "available", "soundwave": "available" },
        "ribbu": { "price": "", "weverse": "available", "everline": "available", "soundwave": "available" },
        "jjaero": { "price": "", "weverse": "available", "everline": "available", "soundwave": "available" },
        "yam": { "price": "", "weverse": "available", "everline": "available", "soundwave": "available" }
    };

    // ⭐️ 3. 멤버와 쇼핑몰을 돌면서 전부 자동으로 긁어오는 로직
    const members = Object.keys(SCRAPE_CONFIG);
    const shops = ['kream', 'everline', 'soundwave'];

    for (const member of members) {
        let priceSet = false; // 가격은 한 쇼핑몰에서만 가져오면 되니까 체크용

        for (const shop of shops) {
            const config = SCRAPE_CONFIG[member][shop];
            const htmlKey = shop === 'kream' ? 'weverse' : shop; // html의 id가 weverse로 되어있어서 매핑해줌

            try {
                console.log(`[${member} - ${shop}] 페이지 접속 중... (${config.url})`);
                await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await delay(2000); // 로딩 대기

                // 3-1. 가격 긁어오기 (아직 가격을 못 가져왔을 때만)
                if (!priceSet) {
                    const priceText = await page.$eval(config.priceSelector, el => el.innerText).catch(() => null);
                    if (priceText) {
                        goodsData[member].price = priceText;
                        priceSet = true;
                    } else {
                        goodsData[member].price = "₩ 18,000"; // 못 긁어오면 기본값 설정
                    }
                }

                // 3-2. 품절 마크 긁어오기
                const isSoldOut = await page.$(config.soldoutSelector); 
                if (isSoldOut) {
                    goodsData[member][htmlKey] = "soldout";
                    console.log(` > 상태: 품절`);
                } else {
                    goodsData[member][htmlKey] = "available";
                    console.log(` > 상태: 구매 가능`);
                }

            } catch (e) {
                console.error(`[${member} - ${shop}] 크롤링 에러! 주소나 태그를 확인하세요.`);
                // 에러 나면 일단 구매 가능(available)로 처리
                goodsData[member][htmlKey] = "available"; 
            }
        }
    }

    await browser.close();
    
    // ⭐️ 4. JSON 파일 저장
    const savePath = 'goods/goods_data.json';
    fs.writeFileSync(savePath, JSON.stringify(goodsData, null, 4), 'utf-8');
    console.log(`✅ 모든 크롤링 완료! 데이터가 [${savePath}]에 저장되었습니다.`);
}

scrapeGoods();
