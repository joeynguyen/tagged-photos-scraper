const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');

require('dotenv').config();

async function download(uri, filename, iter, callback) {
  console.log(`Downloading ${filename}`);
  await request.head(uri, () => {
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on('finish', callback)
      .on('error', (error) => {
        console.log('error', error.message);
        console.log(`failed on iteration: ${iter}`);
      });
  });
}

async function downloadAllPhotos(page, $photos, runScraperEvent) {
  runScraperEvent.sender.send('scraper-status', 'Downloading photos...');
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

    await download(imageSrc, filename, i, async () => {
      const photosDownloaded = i + 1;
      console.log(`Downloaded ${filename} successfully`);
      console.log(`downloaded ${photosDownloaded} photos out of ${$photos.length}`);
      runScraperEvent.sender.send('photos-downloaded', photosDownloaded);
    });

    // press Escape to hide currently displayed high quality image
    await page.keyboard.press('Escape');
    await page.waitFor(2000);
  }
}

async function scrapeInfiniteScrollPhotos(
  page,
  runScraperEvent,
  scrollDelay = 1000,
) {
  let $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
  console.log(`Found ${$taggedPhotos.length} photos`);
  runScraperEvent.sender.send('photos-found', $taggedPhotos.length);

  try {
    let previousHeight = 0;
    let currentHeight = await page.evaluate('document.body.scrollHeight');

    runScraperEvent.sender.send('scraper-status', 'Scrolling down the page to load more photos');
    // keep scrolling to the bottom of the page until there are no more photos to load
    while (previousHeight < currentHeight) {
      previousHeight = currentHeight;
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      currentHeight = await page.evaluate('document.body.scrollHeight');
      await page.waitFor(scrollDelay);
      $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
      console.log(`Found ${$taggedPhotos.length} photos`);
      runScraperEvent.sender.send('photos-found', $taggedPhotos.length);
      console.log('Scrolling down the page to load more photos');
    }
  } catch (e) {
    // there will be an error thrown once the page can't scroll down any further
    // since there aren't any more photos left to load
    // do nothing with the error
    console.log("Can't scroll down anymore");
    runScraperEvent.sender.send('scraper-status', 'Found all of your tagged photos');
  }

  $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
  console.log(`Final count: ${$taggedPhotos.length} tagged photos found.`);
  runScraperEvent.sender.send('photos-found', $taggedPhotos.length);

  await downloadAllPhotos(page, $taggedPhotos, runScraperEvent);
}

async function scrape(runScraperEvent) {
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
  runScraperEvent.sender.send('scraper-status', 'Going to facebook.com');
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com');
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.facebook.com', ['notifications']);

  // Submit login
  console.log('Logging in');
  runScraperEvent.sender.send('scraper-status', 'Logging in');
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
  runScraperEvent.sender.send('scraper-status', 'Going to "Photos of You" page');
  await $photosLink.click();
  await page.waitFor('a[name="Photos of You"]');
  await page.waitFor(1000);

  // scrape photos
  console.log('Searching for photos');
  runScraperEvent.sender.send('scraper-status', 'Searching for photos');
  await scrapeInfiniteScrollPhotos(page, runScraperEvent);
  await page.waitFor(1000);

  // stop puppeteer
  console.log('Shutting down');
  runScraperEvent.sender.send('scraper-status', 'Finished downloading all tagged photos!');
  await page.close();
  await browser.close();
}

module.exports = scrape;
