const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');

require('dotenv').config();

async function download(uri, filename, callback) {
  console.log(`Downloading ${filename}`);
  await request.head(uri, () => {
    request(uri).pipe(fs.createWriteStream(filename)).on('finish', callback);
  });
}

async function downloadAllPhotos(page, $photos) {
  for (let i = 0; i < $photos.length; i++) {
    const $photo = $photos[i];
    /* eslint-disable no-await-in-loop */
    await $photo.click();
    await page.waitForSelector('.fbPhotoSnowliftPopup');

    // 5 second delay for Facebook to figure out appropriate
    // image size to display based on the browser resolution
    await page.waitFor(5000);
    // stop referencing the element handle
    $photo.dispose();

    const imageSrc = await page.$eval('.fbPhotoSnowliftPopup img.spotlight', el => el.src);

    // grab filename of image from URL
    const regx = /[a-zA-Z_0-9]*\.[a-zA-Z]{3,4}(?=\?)/;
    const filename = regx.exec(imageSrc)[0];

    await download(imageSrc, filename, async () => {
      console.log(`Downloaded ${filename} successfully`);
      console.log(`downloaded ${i + 1} photos out of ${$photos.length}`);
    });

    // press Escape to hide currently displayed high quality image
    await page.keyboard.press('Escape');
    await page.waitFor(2000);
  }
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
  //     console.log('scrolling down the page to load more photos');
  //   }
  // } catch (e) {
  //   // there will be an error thrown once the page can't scroll down any further
  //   // since there aren't any more photos left to load
  //   // do nothing with the error
  //     console.log("Can't scroll down anymore");
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
  const $profileLink = await page.waitFor('div[data-click="profile_icon"] a');
  await $profileLink.click();
  const $photosLink = await page.waitFor('a[data-tab-key="photos"]');
  console.log('Going to "Photos of You" page');
  await $photosLink.click();
  await page.waitFor('a[name="Photos of You"]');
  await page.waitFor(1000);

  // scrape photos
  console.log('Searching for photos');
  await scrapeInfiniteScrollPhotos(page);
  await page.waitFor(1000);

  // stop puppeteer
  console.log('Shutting down');
  await page.close();
  await browser.close();
})();
