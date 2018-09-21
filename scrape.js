const puppeteer = require('puppeteer');
// const axios = require('axios');
// const saveAs = require('file-saver');
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

const download = function(uri, filename, callback){
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
      width: 1400,
      height: 900
    }
  });

  // Go to website
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com');
  // const context = browser.defaultBrowserContext();
  // await context.overridePermissions('https://www.facebook.com', ['notifications']);

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

  for (const imgLink of $albumImages) {
    const imageName = imgLink._remoteObject.description;
    await imgLink.click();
    await page.waitFor('.fbPhotoSnowliftContainer');
    const imageSrc = await page.$eval('.spotlight', el => el.src);

    download(imageSrc, `${imageName}.png`, async function(){
      console.log(`done download ${imageName}.png`);
      await page.keyboard.press('Escape');
    });
  }

  await page.waitFor(1000);
  console.log('closing browser');
  await browser.close();
})();
