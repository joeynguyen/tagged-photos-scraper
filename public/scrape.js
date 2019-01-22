const puppeteer = require('puppeteer');
const log = require('electron-log');
const { app, ipcMain } = require('electron');
const { download } = require('electron-dl');
const { TimeoutError } = require('puppeteer/Errors');

require('dotenv').config();

function downloadFile(url, filename, iter, page, ipc, electronWindow) {
  download(electronWindow, url, {
    directory: app.getPath('downloads') + '/tagged-photos-scraper',
    filename,
  })
    .then(downloadItem => {
      log.info(`Downloaded ${filename} successfully`);
      log.info(`Photo #${iter} downloaded`);
      ipc.send('photo-number-downloaded', iter);
    })
    .catch(err => {
      const errMessage = `Downloading failed at photo #${iter} before all photos were downloaded`;
      log.info(errMessage);
      log.error('error', err.message);
      ipc.send('status-friendly', errMessage);
      ipc.send('status-internal', 'crashed');
      page.close();
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
    const hrefPropertyHandle = await $photo.getProperty('href');
    const photoUrl = await hrefPropertyHandle.jsonValue();
    const newPhotoPage = await browser.newPage();
    await newPhotoPage.goto(photoUrl);

    const $fullSizeLink = await newPhotoPage.waitForSelector(
      '[href^="/photo/view_full_size"]',
      { timeout: 10000 }
    );
    /* eslint-disable no-await-in-loop */
    const newPagePromise = new Promise(x => {
      return browser.once('targetcreated', target => x(target.page()));
    });
    await $fullSizeLink.click();
    const newPage = await newPagePromise;

    // await newPhotoPage.waitFor(1000);
    await newPhotoPage.close();
    await newPage.waitFor(1000);
    const imageSrc = await newPage.url();

    // grab filename of image from URL
    const regx = /[a-zA-Z_0-9]*\.[a-zA-Z]{3,4}(?=\?)/;
    let filename = regx.exec(imageSrc)[0];
    // append index number in front of filename for debugging purposes
    filename = `${i}-${filename}`;

    await downloadFile(imageSrc, filename, i, page, ipc, electronWindow);

    await newPage.close();

    // stop referencing the element handle
    $photo.dispose();
  }
}

async function infiniteScrollPhotos(page, ipc, scrollDelay = 1000) {
  const photosQuerySelector = '.timeline.photos a';
  let $taggedPhotos = await page.$$(photosQuerySelector);
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
      await page.waitForFunction(
        `document.body.scrollHeight > ${previousHeight}`,
        { timeout: 10000 }
      );
      currentHeight = await page.evaluate('document.body.scrollHeight');
      await page.waitFor(scrollDelay);
      $taggedPhotos = await page.$$(photosQuerySelector);
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

  $taggedPhotos = await page.$$(photosQuerySelector);
  log.info(`Final count: ${$taggedPhotos.length} tagged photos found.`);
  ipc.send('photos-found', $taggedPhotos.length);

  return $taggedPhotos;
}

async function main(photoStartIndex, visualModeOptions, ipc, electronWindow) {
  const { enabled, width, height } = visualModeOptions;
  // start puppeteer
  const browser = await puppeteer.launch({
    headless: !enabled,
    defaultViewport: {
      width: enabled ? width : 3440,
      height: enabled ? height : 1440,
    },
    // even if the user's focus isn't on this app,
    // don't throttle this app's performance
    webPreferences: { backgroundThrottling: false },
  });

  // Go to website
  const page = await browser.newPage();
  page.on('close', async () => {
    log.info('page closed, closing browser as well');
    await browser.close();
  });

  // handle errors
  process.on('uncaughtException', async err => {
    log.error('process uncaughtException error', err);
    ipc.send(
      'status-friendly',
      `The scraper crashed unexpectedly with an error: ${err}. If you would like to continue downloading where you left off, click the button below.`
    );
    ipc.send('status-internal', 'crashed');
    await page.close();
  });
  page.on('pageerror', async err => {
    log.error('page uncaughtException error', err);
    ipc.send(
      'status-friendly',
      `The scraper crashed unexpectedly with an error: ${err}. If you would like to continue downloading where you left off, click the button below.`
    );
    ipc.send('status-internal', 'crashed');
    await page.close();
  });
  page.on('error', async err => {
    log.error('puppeteer page crash error', err);
    ipc.send(
      'status-friendly',
      `The scraper crashed unexpectedly with an error: ${err}. If you would like to continue downloading where you left off, click the button below.`
    );
    ipc.send('status-internal', 'crashed');
    await page.close();
  });
  browser.on('disconnected', async () => {
    log.warn('puppeteer browser disconnected');
    await browser.close();
  });
  ipcMain.on('stop-scraper', () => {
    // don't use async/await because we don't want to wait for other processes
    // immediately shut down puppeteer
    log.warn('puppeteer received a stop request');
    ipc.send(
      'status-friendly',
      'The scraper was stopped. If you would like to continue downloading where you left off, click the button below.'
    );
    ipc.send('status-internal', 'failed');
    page.close();
  });

  // navigate to Facebook
  log.info('Going to facebook.com');
  ipc.send('status-friendly', 'Going to facebook.com');
  await page.goto('https://m.facebook.com');

  // Submit login
  log.info('Logging in');
  ipc.send('status-friendly', 'Logging in');
  await page.focus('input[name="email"]');
  await page.keyboard.type(process.env.USERNAME);
  const $passField = await page.$('input[name="pass"]');
  await $passField.type(process.env.PASSWORD);
  await $passField.press('Enter');

  // Bypass FB message to remember user on this browser
  let $rememberUserButtonNo;
  try {
    $rememberUserButtonNo = await page.waitForSelector(
      '[href^="/login/save-device/cancel"]',
      {
        timeout: 10000,
      }
    );
  } catch (e) {
    if (e instanceof TimeoutError) {
      // await page.waitForSelector('#reg-link', { timeout: 10000 })
      await page
        .waitForSelector('[aria-label="Did you forget your password?"]', {
          timeout: 10000,
        })
        .then(async () => {
          log.error('login credentails incorrect');
          ipc.send('status-internal', 'failed');
          ipc.send('status-friendly', 'The login credentials are incorrect');
        })
        .catch(async () => {
          await page
            .waitForSelector('[href^="/reg/"]', { timeout: 10000 })
            .then(async () => {
              log.error('login credentails incorrect');
              ipc.send('status-internal', 'failed');
              ipc.send('status-friendly', "That account doesn't exist");
            })
            .catch(async () => {
              log.error("Couldn't find profile_icon selector on homepage");
              ipc.send('status-internal', 'failed');
              ipc.send(
                'status-friendly',
                'The page is missing a required, expected link.  Please let the developer of this app know about this issue.'
              );
            })
            .finally(async () => {
              await page.close();
            });
        });
    }
  }
  await $rememberUserButtonNo.click();
  await page.waitForNavigation();

  // Go to Profile page from Homepage
  log.info('Going to your profile page');
  ipc.send('status-friendly', 'Going to your profile page');
  const $profileLink = await page.waitForSelector('#MComposer a', {
    timeout: 10000,
  });
  await $profileLink.click();

  // Go to "Photos of You" page
  log.info('Going to "Photos of You" page');
  ipc.send('status-friendly', 'Going to "Photos of You" page');
  await page.waitForSelector('[href^="/profile/wizard/refresher"]', {
    timeout: 5000,
  });
  const userProfileUrl = await page.url();
  console.log('userProfileUrl', userProfileUrl);
  await page.goto(`${userProfileUrl}/photos`);

  // scrape photos
  log.info('Searching for photos');
  ipc.send('status-friendly', 'Searching for photos');
  const $taggedPhotos = await infiniteScrollPhotos(page, ipc);
  if (photoStartIndex > $taggedPhotos.length) {
    log.error(
      "The number of the photo the user requested to start at was higher than the number of the user's tagged photos"
    );
    ipc.send('status-internal', 'failed');
    ipc.send(
      'status-friendly',
      'The number of the photo you requested to start at was higher than the number of existing photos'
    );
  } else {
    await downloadAllPhotos(
      photoStartIndex,
      $taggedPhotos,
      page,
      browser,
      ipc,
      electronWindow
    );
    await page.waitFor(1000);
    ipc.send('status-friendly', 'Finished downloading all tagged photos!');
    ipc.send('status-internal', 'complete');
  }

  // stop puppeteer
  log.info('Stopping puppeteer');
  await page.close();
}

module.exports = main;
