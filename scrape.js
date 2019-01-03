const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');

require('dotenv').config();

const download = async function (uri, filename, callback) {
  request.head(uri, (err, res, body) => {
    // console.log('content-type:', res.headers['content-type']);
    // console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

const downloadAllPhotos = async function ($photos) {
  for (const imgLink of $photos) {
    const imageName = imgLink._remoteObject.description;
    await imgLink.click();
    // don't need to keep reference in memory
    imgLink.dispose();
    // 4 second delay for Facebook to figure out right image size to display based on the browser resolution
    await page.waitFor(4000);
    await page.waitForSelector('.fbPhotoSnowliftContainer');
    // const photoContainer = await page.$('.fbPhotoSnowliftContainer');
    // const imageSrc = await photoContainer.$eval('.spotlight', nodes => nodes.map(n => n.src));
    const imageSrc = await page.$eval('.fbPhotoSnowliftContainer img.spotlight', el => el.src);
    // await page.waitFor(2000);

    await download(imageSrc, `${imageName}.png`, async () => {
      console.log(`done downloading ${imageName}.png`);
      // await page.waitFor(2000);
      await page.keyboard.press('Escape');
    });
  }
};

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

  await downloadAllPhotos($taggedPhotos);
}

(async () => {
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

  // const $albumWrapper = await page.$$('.fbPhotosRedesignBorderOverlay');
  // const albumWrapperStyle = await page.$eval('.fbPhotosRedesignBorderOverlay', el => el.attributes.style.value);
  // console.log(`albumWrapperStyle: ${JSON.stringify(albumWrapperStyle)}`);
  // const $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
  // console.log(`taggedPhotos length: ${$taggedPhotos.length}`);
  // const imgLink = await $taggedPhotos[3];
  // let $likesHeader = await page.$('#medley_header_likes');
  // let $booksHeader = await page.$('#medley_header_books');
  // let $currentLastPhoto = await $taggedPhotos[$taggedPhotos.length - 1];
  // while (!$booksHeader) {
  //   await $currentLastPhoto.hover();
  //   await page.waitFor(2000);
  //   $likesHeader = await page.$('#medley_header_likes');
  // }

  await scrapeInfiniteScrollPhotos(page);

  await page.waitFor(1000);
  console.log('closing browser');
  await browser.close();
})();
