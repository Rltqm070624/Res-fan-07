import puppeteer from 'puppeteer';
import fs from 'fs';

// ⭐️ REMINI는 WITHMUU, 나머지는 KREAM으로 타겟 명확화
const TARGETS = [
    { member: 'remini', shop: 'withmuu', url: 'https://withmuu.com/goods/goods_view.php?goodsNo=1000014598' },
    { member: 'jota', shop: 'kream', url: 'https://kream.co.kr/products/985255' },
    { member: 'ming', shop: 'kream', url: 'https://kream.co.kr/products/985257' },
    { member: 'ribbu', shop: 'kream', url: 'https://kream.co.kr/products/985256' },
    { member: 'jjaero', shop: 'kream', url: 'https://kream.co.kr/products/985259' },
    { member: 'yam', shop: 'kream', url: 'https://kream.co.kr/products/985258' }
];

async function scrapeGoods() {
    console.log("🤖 굿즈 데이터 스마트 크롤링 시작...");

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 저장할 데이터 기본 뼈대
    const goodsData = {
        remini: { price: "가격 확인중...", withmuu: "available" },
        jota: { price: "가격 확인중...", kream: "available" },
        ming: { price: "가격 확인중...", kream: "available" },
        ribbu: { price: "가격 확인중...", kream: "available" },
        jjaero: { price: "가격 확인중...", kream: "available" },
        yam: { price: "가격 확인중...", kream: "available" }
    };

    for (const target of TARGETS) {
        try {
            console.log(`[${target.member} - ${target.shop}] 접속 중...`);
            await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 4000)); // 로딩 4초 여유롭게 대기

            // 페이지 안의 텍스트를 지능적으로 스캔
            const result = await page.evaluate(() => {
                let extractedPrice = null;
                let soldOut = false;

                // 1. 가격 찾기 (Kream: .amount, Withmuu: .item_price 또는 .price)
                const priceEl = document.querySelector('.amount') || document.querySelector('.item_price') || document.querySelector('.price');
                if (priceEl) extractedPrice = priceEl.innerText;

                // 2. 품절 찾기 (다양한 품절 마크 및 버튼 검사)
                const soldOutMark = document.querySelector('.btn_soldout, .soldout, .soldout_mark, .btn_add_soldout');
                if (soldOutMark) soldOut = true;

                const btns = document.querySelectorAll('button, a');
                for (let b of btns) {
                    const text = b.innerText || "";
                    if (text.includes('품절') || text.includes('SOLD OUT')) soldOut = true;
                }

                return { extractedPrice, soldOut };
            });

            // 스캔 결과 반영
            if (result.soldOut) {
                goodsData[target.member][target.shop] = "soldout";
            }

            if (result.extractedPrice) {
                // 숫자와 쉼표(예: 45,000)만 깔끔하게 추출
                const match = result.extractedPrice.match(/[0-9,]{4,}/);
                if (match) {
                    goodsData[target.member].price = `₩ ${match[0]}`;
                } else {
                    goodsData[target.member].price = `₩ ${result.extractedPrice.trim()}`;
                }
            } else {
                goodsData[target.member].price = "₩ 18,000"; // 못 찾으면 기본값
            }

        } catch (e) {
            console.error(`[${target.member}] 에러 발생, 기본값 세팅.`);
            goodsData[target.member].price = "₩ 18,000";
        }
    }

    await browser.close();
    
    // JSON 파일 덮어쓰기
    const savePath = 'goods/goods_data.json';
    fs.writeFileSync(savePath, JSON.stringify(goodsData, null, 4), 'utf-8');
    console.log(`✅ 데이터 저장 완료: ${savePath}`);
}

scrapeGoods();
