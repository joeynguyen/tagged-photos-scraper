const puppeteer = require('puppeteer');
const log = require('electron-log');
const { ipcMain } = require('electron');
const { TimeoutError } = require('puppeteer/Errors');

const downloadAllPhotos = require('./downloadAllPhotos.js');
const infiniteScrollPhotos = require('./infiniteScrollPhotos.js');

async function scrape(
  username,
  password,
  photoStartIndex,
  visualModeOptions,
  ipc,
  electronWindow
) {
  ipc.send('status', {
    statusCode: 1,
    message: 'Started',
  });
  ipc.send('log-file-location', log.transports.file.findLogPath());
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
    ipc.send('status', {
      statusCode: 98,
      message: `The scraper crashed unexpectedly with an error: ${err}. If you would like to continue downloading where you left off, click the button below.`,
    });
    await page.close();
  });
  page.on('pageerror', async err => {
    log.error('page uncaughtException error', err);
    ipc.send('status', {
      statusCode: 98,
      message: `The scraper crashed unexpectedly with an error: ${err}. If you would like to continue downloading where you left off, click the button below.`,
    });
    await page.close();
  });
  page.on('error', async err => {
    log.error('puppeteer page crash error', err);
    ipc.send('status', {
      statusCode: 98,
      message: `The scraper crashed unexpectedly with an error: ${err}. If you would like to continue downloading where you left off, click the button below.`,
    });
    await page.close();
  });
  browser.on('disconnected', async () => {
    log.warn('puppeteer browser disconnected');
    await browser.close();
  });
  ipcMain.on('stop-scraper', () => {
    log.warn('puppeteer received a stop request');
    ipc.send('status', {
      statusCode: 99,
      message:
        'The scraper was stopped. If you would like to continue downloading where you left off, click the button below.',
    });
    // don't use async/await because we don't want to wait for other processes
    // immediately shut down puppeteer
    page.close();
  });

  // navigate to Facebook
  log.info('Going to facebook.com');
  ipc.send('status', {
    statusCode: 2,
    message: 'Going to facebook.com',
  });
  await page.goto('https://m.facebook.com').catch(async err => {
    log.error(`Error: ${err}`);
    ipc.send('status', {
      statusCode: 99,
      message:
        'Error navigating to https://m.facebook.com.  Is there a problem with your Internet connection or is there something preventing you from going to this site in your browser?',
    });
    await page.close();
  });

  // Submit login
  log.info('Logging in');
  ipc.send('status', {
    statusCode: 3,
    message: 'Logging in',
  });
  await page.focus('input[name="email"]');
  await page.keyboard.type(username);
  const $passField = await page.$('input[name="pass"]');
  await $passField.type(password);
  await $passField.press('Enter');

  // Bypass FB message to remember user on this browser
  let $rememberUserButtonNo;
  try {
    $rememberUserButtonNo = await page.waitForSelector(
      '[href^="/login/save-device/cancel"]',
      {
        timeout: 5000,
      }
    );
  } catch (e) {
    if (e instanceof TimeoutError) {
      // await page.waitForSelector('#reg-link', { timeout: 10000 })
      await page
        .waitForSelector('[aria-label="Did you forget your password?"]', {
          timeout: 2000,
        })
        .then(async () => {
          log.error('login credentails incorrect');
          ipc.send('status', {
            statusCode: 99,
            message: 'The login credentials are incorrect',
          });
        })
        .catch(async () => {
          await page
            .waitForSelector('[href^="/reg/"]', { timeout: 2000 })
            .then(async () => {
              log.error('login credentails incorrect');
              ipc.send('status', {
                statusCode: 99,
                message: "That account doesn't exist",
              });
            })
            .catch(async () => {
              log.error("Couldn't find profile_icon selector on homepage");
              ipc.send('status', {
                statusCode: 99,
                message:
                  'The page is missing a required, expected link.  Please let the developer of this app know about this issue.',
              });
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
  ipc.send('status', {
    statusCode: 4,
    message: 'Going to your profile page',
  });
  const $profileLink = await page.waitForSelector('#MComposer a', {
    timeout: 10000,
  });
  await $profileLink.click();

  // Go to "Photos" page
  log.info('Going to "Photos" page');
  ipc.send('status', {
    statusCode: 5,
    message: 'Going to "Photos" page',
  });
  await page.waitForSelector('[href^="/profile/wizard/refresher"]', {
    timeout: 5000,
  });
  const userProfileUrl = await page.url();
  console.log('userProfileUrl', userProfileUrl);
  await page.goto(`${userProfileUrl}/photos`);

  // scrape photos
  log.info('Searching for photos');
  ipc.send('status', {
    statusCode: 6,
    message: 'Searching for photos',
  });
  const $taggedPhotos = await infiniteScrollPhotos(page, ipc);
  if (photoStartIndex > $taggedPhotos.length) {
    log.error(
      "The number of the photo the user requested to start at was higher than the number of the user's tagged photos"
    );
    ipc.send('status', {
      statusCode: 99,
      message:
        'The number of the photo you requested to start at was higher than the number of existing photos',
    });
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
    ipc.send('status', {
      statusCode: 100,
      message: 'Finished downloading all tagged photos!',
    });
  }

  // stop puppeteer
  log.info('Stopping puppeteer');
  await page.close();
}

module.exports = scrape;
