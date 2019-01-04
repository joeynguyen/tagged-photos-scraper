const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');

require('dotenv').config();

async function download(uri, filename, callback) {
  console.log(`Downloading ${filename}`);
  await request.head(uri, () => {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

async function downloadAllPhotos(page, $photos) {
  const $photo = $photos[0];

  // for (const $photo of $photos) {
  /* eslint-disable no-await-in-loop */
  await $photo.click();
  // don't need to keep reference in memory
  $photo.dispose();
  await page.waitForSelector('.fbPhotoSnowliftPopup');
  // 4 second delay for Facebook to figure out appropriate
  // image size to display based on the browser resolution
  await page.waitFor(4000);

  const imageSrc = await page.$eval('.fbPhotoSnowliftPopup img.spotlight', el => el.src);

  // grab filename of image from URL
  const reg = /[a-zA-Z_0-9]*\.[a-zA-Z]{3,4}(?=\?)/;
  const filename = reg.exec(imageSrc)[0];
  await page.waitFor(2000);

  await download(imageSrc, filename, async () => {
    try {
      console.log(`Downloaded ${filename} successfully`);
      await page.keyboard.press('Escape');
      console.log('Escape pressed');

      await page.waitFor(2000);
      console.log('waited 2 secs again');
    } catch (err) {
      console.log('err', err);
    }
  });
  // }
}

async function scrapeInfiniteScrollPhotos(
  page,
  scrollDelay = 1000,
) {
  // try {
  //   let previousHeight = 0;
  //   let currentHeight = await page.evaluate('document.body.scrollHeight');

  //   // keep scrolling to the bottom of the page until there are no more photos to load
  //   while (previousHeight < currentHeight) {
  //     previousHeight = currentHeight;
  //     await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
  //     await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
  //     currentHeight = await page.evaluate('document.body.scrollHeight');
  //     await page.waitFor(scrollDelay);
  //   }
  // } catch (e) {
  //   // there will be an error thrown once the page can't scroll down any further
  //   // since there aren't any more photos left to load
  //   // do nothing with the error
  // }

  const $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
  console.log(`Found ${$taggedPhotos.length} tagged photos`);

  await downloadAllPhotos(page, $taggedPhotos);
}

(async () => {
  // start puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 3440,
      height: 1440,
    },
  });

  // Go to website
  console.log('Going to facebook.com');
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com');
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.facebook.com', ['notifications']);

  // Submit login
  console.log('Logging in');
  page.focus('#email');
  await page.keyboard.type(process.env.USERNAME);
  const $passField = await page.$('input#pass');
  await $passField.type(process.env.PASSWORD);
  await $passField.press('Enter');

  // Go to "Photos of You" page
  console.log('Going to "Photos of You" page');
  const $profileLink = await page.waitFor('div[data-click="profile_icon"] a');
  await $profileLink.click();
  const $photosLink = await page.waitFor('a[data-tab-key="photos"]');
  await $photosLink.click();
  await page.waitFor('a[name="Photos of You"]');
  await page.waitFor(1000);

  // scrape photos
  console.log('Searching for photos');
  await scrapeInfiniteScrollPhotos(page);

  // stop puppeteer
  await page.waitFor(5000);
  console.log('waited 5 sec');
  console.log('Shutting down');
  await page.close();
  console.log('page closed');

  await browser.close();
  console.log('browser closed');
})();
