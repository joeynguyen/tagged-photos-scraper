const puppeteer = require('puppeteer');
const log = require('electron-log');
const { ipcMain } = require('electron');
const { TimeoutError } = require('puppeteer/Errors');

const downloadAllPhotos = require('./lib/downloadAllPhotos.js');
const infiniteScrollPhotos = require('./lib/infiniteScrollPhotos.js');

require('dotenv').config();

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

  // Go to "Photos" page
  log.info('Going to "Photos" page');
  ipc.send('status-friendly', 'Going to "Photos" page');
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
