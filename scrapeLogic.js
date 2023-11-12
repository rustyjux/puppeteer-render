const puppeteer = require("puppeteer");
require("dotenv").config();

const scrapeLogic = async (res, darkMode) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    // Capture the screenshot
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0); // TODO - set high but not unlimited
    const timeout = 0; // TODO - set high but not unlimited
    // const timeout = 30000;
    // await page.goto("https://www.example.org/");
    console.log(`Loading page`)
    await page.goto("https://nordic-pulse.com/ski-areas/CA/BC/Black-Jack-Ski-Club", {timeout:0});
    await page.setViewport({width: 2160, height: 1920});
    // await page.setViewport({ width: 1080, height: 1024 });
    console.log('Waiting for page to load')

    
    await waitTillHTMLRendered(page)
    console.log(`Capturing screenshot`)
    console.log(`Capturing screenshot - dark mode? ${darkMode}`)
    if (darkMode === 'true') {
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.map-settings > button'),
                targetPage.locator('::-p-xpath(/html/body/app-root/div/app-ski-area/div/div/div/npl-map-libre/div/div/div[3]/button)'),
                targetPage.locator(':scope >>> div.map-settings > button')
            ])
                .setTimeout(timeout)
                .click({
                  offset: {
                    x: 15,
                    y: 14,
                  },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Dark) >>>> ::-p-aria([role=\\"image\\"])'),
                targetPage.locator('button:nth-of-type(2) > ion-img >>>> img'),
                targetPage.locator(':scope >>> button:nth-of-type(2) > ion-img >>>> :scope >>> img')
            ])
                .setTimeout(timeout)
                .click({
                  offset: {
                    x: 31,
                    y: 28,
                  },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.map-settings > div > span'),
                targetPage.locator('::-p-xpath(/html/body/app-root/div/app-ski-area/div/div/div/npl-map-libre/div/div/div[3]/div/span)'),
                targetPage.locator(':scope >>> div.map-settings > div > span')
            ])
                .setTimeout(timeout)
                .click({
                  offset: {
                    x: 13,
                    y: 15,
                  },
                });
        }
        await delay(2000);
    }
    
    const map = await page.$('body > app-root > div > app-ski-area > div > div > div');
    const screenshot = await map.screenshot();
    console.log('Returning screenshot')
    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);
} catch (e) {
    console.error('Error capturing screenshot:', e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
} finally {
  await browser.close();
}
}

const waitTillHTMLRendered = async (page, timeout = 60000) => {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while(checkCounts++ <= maxChecks){
    let html = await page.content();
    let currentHTMLSize = html.length; 

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

    if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
      countStableSizeIterations++;
    else 
      countStableSizeIterations = 0; //reset the counter

    if(countStableSizeIterations >= minStableSizeIterations) {
      console.log("Page rendered fully..");
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitForTimeout(checkDurationMsecs);
  }  
};

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

module.exports = { scrapeLogic };
