const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeGoods() {
    // 1. 가상의 크롬 브라우저 띄우기
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // 2. 저장할 데이터 틀
    const goodsData = {
        "jota": { "weverse": 0, "everline": 0, "soundwave": 0 },
        // 필요한 굿즈 멤버 계속 추가...
    };

    console.log("🤖 굿즈 재고 크롤링 시작...");

    try {
        // [예시] 에버라인 Jota 상품 페이지 접속
        // await page.goto('https://실제_에버라인_상품_주소.com', { waitUntil: 'networkidle2' });
        
        // 에버라인의 '품절' 버튼 클래스(.btn_soldout)가 화면에 있는지 확인
        // const isSoldOut = await page.$('.btn_soldout'); 
        
        // if (isSoldOut) {
        //     goodsData.jota.everline = 0;
        // } else {
        //     goodsData.jota.everline = 15; // 수량 파악이 어려우면 '있음(15)'으로 임의 처리
        // }

        // 테스트용 임의 데이터 할당 (나중에 위 주석 풀고 실제 로직으로 교체하세요)
        goodsData.jota.everline = 15;
        goodsData.jota.weverse = 0;
        goodsData.jota.soundwave = 120;

    } catch (e) {
        console.error("크롤링 중 에러 발생:", e);
    }

    // 3. 브라우저 닫고 JSON 파일로 저장
    await browser.close();
    fs.writeFileSync('goods_data.json', JSON.stringify(goodsData, null, 4), 'utf-8');
    console.log("✅ goods_data.json 저장 완료!");
}

scrapeGoods();
