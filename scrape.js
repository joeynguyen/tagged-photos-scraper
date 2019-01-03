const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');

require('dotenv').config();

async function download(uri, filename, callback) {
  request.head(uri, () => {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

async function downloadAllPhotos(page, $photos) {
  for (const $photo of $photos) {
    /* eslint-disable no-underscore-dangle */
    const imageName = $photo._remoteObject.description;
    /* eslint-disable no-await-in-loop */
    await $photo.click();
    // don't need to keep reference in memory
    $photo.dispose();
    // 4 second delay for Facebook to figure out appropriate
    // image size to display based on the browser resolution
    await page.waitFor(4000);
    await page.waitForSelector('.fbPhotoSnowliftContainer');

    const imageSrc = await page.$eval('.fbPhotoSnowliftContainer img.spotlight', el => el.src);
    await page.waitFor(2000);

    await download(imageSrc, `${imageName}.png`, async () => {
      console.log(`done downloading ${imageName}.png`);
      await page.waitFor(2000);
      await page.keyboard.press('Escape');
    });
  }
}

async function scrapeInfiniteScrollPhotos(
  page,
  scrollDelay = 1000,
) {
  let $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
  console.log(`taggedPhotos initial length: ${$taggedPhotos.length}`);

  try {
    let previousHeight = 0;
    let currentHeight = await page.evaluate('document.body.scrollHeight');

    // keep scrolling to the bottom of the page until there are no more photos to load
    while (previousHeight < currentHeight) {
      previousHeight = currentHeight;
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      currentHeight = await page.evaluate('document.body.scrollHeight');
      await page.waitFor(scrollDelay);
    }
  } catch (e) {
    // there will be an error thrown once the page can't scroll down any further
    // since there aren't any more photos left to load
    // do nothing with the error
  }

  $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
  console.log(`taggedPhotos FINAL length: ${$taggedPhotos.length}`);

  await downloadAllPhotos(page, $taggedPhotos);
}

(async () => {
  // start puppeteer
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1600,
      height: 940,
    },
  });

  // Go to website
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com');
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.facebook.com', ['notifications']);

  // Submit login
  page.focus('#email');
  await page.keyboard.type(process.env.USERNAME);
  const $passField = await page.$('input#pass');
  await $passField.type(process.env.PASSWORD);
  await $passField.press('Enter');

  // Go to "Photos of You" page
  const $profileLink = await page.waitFor('div[data-click="profile_icon"] a');
  await $profileLink.click();
  const $photosLink = await page.waitFor('a[data-tab-key="photos"]');
  await $photosLink.click();
  await page.waitFor('a[name="Photos of You"]');
  await page.waitFor(1000);

  // scrape photos
  await scrapeInfiniteScrollPhotos(page);

  // stop puppeteer
  await page.waitFor(1000);
  console.log('closing browser');
  await browser.close();
})();
