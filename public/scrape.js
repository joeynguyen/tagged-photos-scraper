const puppeteer = require('puppeteer');
const log = require('electron-log');
const { app } = require('electron');
const { download } = require('electron-dl');

require('dotenv').config();

async function downloadFile(uri, filename, iter, browser, ipc, electronWindow) {
  download(electronWindow, uri, {
    directory: app.getPath('downloads') + "/tagged-photos-scraper",
    filename
  })
    .then(downloadItem => {
      const filesize = downloadItem.getTotalBytes()
      if (filesize < 30000) {

      }
      const photosDownloaded = iter + 1;
      log.info(`Downloaded ${filename} successfully`);
      log.info(`${photosDownloaded} photos downloaded`);
      ipc.send('photos-downloaded', photosDownloaded);
    })
    .catch(err => {
      const errMessage = `Downloading failed at photo #${iter} before all photos were downloaded`;
      log.info(errMessage);
      log.error('error', err.message);
      ipc.send('status-friendly', errMessage);
      ipc.send('status-internal', 'crashed');
      browser.close()
    });
}

async function downloadAllPhotos(
    photoStartIndex,
    $photos,
    page,
    browser,
    ipc,
    electronWindow
  ) {
  ipc.send('status-friendly', 'Downloading photos...');

  for (let i = photoStartIndex; i < $photos.length; i++) {
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
    let filename = regx.exec(imageSrc)[0];
    // append index number in front of filename for debugging purposes
    filename = `${i}-${filename}`;

    await downloadFile(imageSrc, filename, i, browser, ipc, electronWindow);

    // press Escape to hide currently displayed high quality image
    await page.keyboard.press('Escape');
    await page.waitFor(2000);
  }
}

async function scrapeInfiniteScrollPhotos(
  page,
  ipc,
  scrollDelay = 1000,
) {
  let $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
  log.info(`Found ${$taggedPhotos.length} photos`);
  ipc.send('photos-found', $taggedPhotos.length);

  try {
    let previousHeight = 0;
    let currentHeight = await page.evaluate('document.body.scrollHeight');

    ipc.send('status-friendly', 'Scrolling down the page to load more photos');
    // keep scrolling to the bottom of the page until there are no more photos to load
    while (previousHeight < currentHeight) {
      previousHeight = currentHeight;
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      currentHeight = await page.evaluate('document.body.scrollHeight');
      await page.waitFor(scrollDelay);
      $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
      log.info(`Found ${$taggedPhotos.length} photos`);
      ipc.send('photos-found', $taggedPhotos.length);
      log.info('Scrolling down the page to load more photos');
    }
  } catch (e) {
    // there will be an error thrown once the page can't scroll down any further
    // since there aren't any more photos left to load
    // do nothing with the error
    log.info("Can't scroll down anymore");
    ipc.send('status-friendly', 'Found all of your tagged photos');
  }

  $taggedPhotos = await page.$$('ul.fbPhotosRedesignBorderOverlay > li > a');
  log.info(`Final count: ${$taggedPhotos.length} tagged photos found.`);
  ipc.send('photos-found', $taggedPhotos.length);

  return $taggedPhotos;
}

async function main(photoStartIndex, ipc, electronWindow) {
  // start puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 3440,
      height: 1440,
    },
    // even if the user's focus isn't on this app,
    // don't throttle this app's performance
    webPreferences: { backgroundThrottling: false }
  });

  // Go to website
  const page = await browser.newPage();
  // let result = await page.evaluate(
  //   () => {
  //     return window.innerWidth;
  //   }
  // );
  // log.info(`Detected window.innerWidth to be ${result}.`);

  // handle errors
  process.on('uncaughtException', (err) => {
    log.error('error', err);
    ipc.send('status-friendly', `The app crashed unexpectedly with error: ${err}`);
    ipc.send('status-internal', 'crashed');
    browser.close();
  });
  page.on('error', (err) => {
    log.error('error', err);
    ipc.send('status-friendly', `Page error: ${err}`);
    ipc.send('status-internal', 'crashed');
    browser.close();
  });

  // navigate to Facebook
  log.info('Going to facebook.com');
  ipc.send('status-friendly', 'Going to facebook.com');
  await page.goto('https://www.facebook.com');
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.facebook.com', ['notifications']);

  // Submit login
  log.info('Logging in');
  ipc.send('status-friendly', 'Logging in');
  page.focus('#email');
  await page.keyboard.type(process.env.USERNAME);
  const $passField = await page.$('input#pass');
  await $passField.type(process.env.PASSWORD);
  await $passField.press('Enter');

  // Go to "Photos of You" page
  const $profileLink = await page.waitFor('div[data-click="profile_icon"] a');
  await $profileLink.click();
  const $photosLink = await page.waitFor('a[data-tab-key="photos"]');
  log.info('Going to "Photos of You" page');
  ipc.send('status-friendly', 'Going to "Photos of You" page');
  await $photosLink.click();
  await page.waitFor('a[name="Photos of You"]');
  await page.waitFor(1000);

  // scrape photos
  log.info('Searching for photos');
  ipc.send('status-friendly', 'Searching for photos');
  const $taggedPhotos = await scrapeInfiniteScrollPhotos(page, ipc);
  await downloadAllPhotos(photoStartIndex, $taggedPhotos, page, browser, ipc, electronWindow);
  await page.waitFor(1000);

  // stop puppeteer
  log.info('Stopping puppeteer');
  ipc.send('status-friendly', 'Finished downloading all tagged photos!');
  ipc.send('status-internal', 'complete');
  await page.close();
  await browser.close();
  log.info('puppeeter browser closed');
}

module.exports = main;
