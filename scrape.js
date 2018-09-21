const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');

function delay() {
  return new Promise(resolve => setTimeout(resolve, 300));
}

async function delayedLog(item) {
  // notice that we await a function that returns a promise
  await delay();

  console.log(item)
}

async function processArray(array) {
  for (const item of array) {
    await delayedLog(item);
  }
  console.log('Done!')
}

const download = async function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1440,
      height: 900
    }
  });

  // Go to website
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com');
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.facebook.com', ['notifications']);

  // Submit login
  page.focus('#email');
  await page.keyboard.type('');
  const $passField = await page.$('input#pass');
  await $passField.type('');
  await $passField.press('Enter');

  // Go to Photos of Your page
  const $profileLink = await page.waitFor('div[data-click="profile_icon"] a');
  await $profileLink.click();
  const $photosLink = await page.waitFor('a[data-tab-key="photos"]');
  await $photosLink.click();
  await page.waitFor('a[name="Photos of You"]');
  await page.waitFor(1000);

  const $albumImages = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
  // const imgLink = await $albumImages[3];
  // let $likesHeader = await page.$('#medley_header_likes');
  // let $booksHeader = await page.$('#medley_header_books');
  // let $currentLastPhoto = await $albumImages[$albumImages.length - 1];
  // while (!$booksHeader) {
  //   await $currentLastPhoto.hover();
  //   await page.waitFor(2000);
  //   $likesHeader = await page.$('#medley_header_likes');
  // }

  for (const imgLink of $albumImages) {
    const imageName = imgLink._remoteObject.description;
    await imgLink.click();
    imgLink.dispose();
    // 2 second delay for Facebook to figure out right image size to display based on the browser resolution
    await page.waitFor(4000);
    await page.waitForSelector('.fbPhotoSnowliftContainer');
    // const photoContainer = await page.$('.fbPhotoSnowliftContainer');
    // const imageSrc = await photoContainer.$eval('.spotlight', nodes => nodes.map(n => n.src));
    const imageSrc = await page.$eval('.fbPhotoSnowliftContainer img.spotlight', el => el.src);
    await page.waitFor(2000);

    await download(imageSrc, `${imageName}.png`, async function(){
      console.log(`done download ${imageName}.png`);
      await page.waitFor(2000);
      await page.keyboard.press('Escape');
    });
  }

  await page.waitFor(1000);
  console.log('closing browser');
  await browser.close();
})();
