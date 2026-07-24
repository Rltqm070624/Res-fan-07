const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeGoods() {
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // 저장할 데이터 뼈대 (상태는 available / soldout 두 가지로 기록)
    const goodsData = {
        "jota": { "price": "", "weverse": "available", "everline": "available", "soundwave": "available" },
        "ming": { "price": "", "weverse": "available", "everline": "available", "soundwave": "available" }
        // 필요 시 다른 멤버 추가
    };

    console.log("🤖 굿즈 가격 및 품절 유무 크롤링 시작...");

    try {
        // ==============================================================
        // ⭐️ [Jota 에버라인 크롤링 예시]
        // ==============================================================
        await page.goto('https://실제_에버라인_상품주소...', { waitUntil: 'networkidle2' });
        
        // 1. 가격 긁어오기
        // 크롬 개발자도구로 가격이 적힌 곳의 클래스명(예: .price-text)을 적어줍니다.
        const priceText = await page.$eval('.price-text', el => el.innerText).catch(() => "가격 정보 없음");
        goodsData.jota.price = priceText; // 긁어온 가격 저장 (예: "₩ 18,000")

        // 2. 품절 유무 긁어오기
        // 품절 버튼을 나타내는 클래스명(예: .btn_soldout)이 화면에 있는지 검사합니다.
        const isSoldOut = await page.$('.btn_soldout'); 
        if (isSoldOut) {
            goodsData.jota.everline = "soldout";
        } else {
            goodsData.jota.everline = "available";
        }

        // ==============================================================
        // 위와 같은 방식으로 위버스샵 등 다른 사이트도 차례대로 크롤링하도록 추가하시면 됩니다.
        // ==============================================================

    } catch (e) {
        console.error("크롤링 중 에러 발생:", e);
    }

    await browser.close();
    
    // 가져온 데이터를 goods/goods_data.json 경로에 저장
    fs.writeFileSync('goods/goods_data.json', JSON.stringify(goodsData, null, 4), 'utf-8');
    console.log("✅ 가격 및 품절 유무 크롤링 완료!");
}

scrapeGoods();
