const puppeteer = require('puppeteer');
const { TimeoutError } = require('puppeteer/Errors');
const log = require('electron-log');
const { ipcMain } = require('electron');

const downloadAllPhotos = require('./downloadAllPhotos.js');
const infiniteScrollPhotos = require('./infiniteScrollPhotos.js');
const RETRY_MESSAGE =
  'If you would like to continue downloading ' +
  'where you left off, click the "Retry" button.';

function getChromiumExecPath() {
  // https://github.com/GoogleChrome/puppeteer/issues/2134#issuecomment-408221446
  return puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked');
}

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
    message: `Starting with photo #${photoStartIndex +
      1}. This tool uses Google's Puppeteer library (https://developers.google.com/web/tools/puppeteer/) under the hood to download your photos.`,
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
    executablePath: getChromiumExecPath(),
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
      message: `The scraper crashed unexpectedly with an error: ${err}. ${RETRY_MESSAGE}`,
    });
    await page.close();
  });
  page.on('pageerror', async err => {
    log.error('page uncaughtException error', err);
    ipc.send('status', {
      statusCode: 98,
      message: `The scraper crashed unexpectedly with an error: ${err}. ${RETRY_MESSAGE}`,
    });
    await page.close();
  });
  page.on('error', async err => {
    log.error('puppeteer page crash error', err);
    ipc.send('status', {
      statusCode: 98,
      message: `The scraper crashed unexpectedly with an error: ${err}. ${RETRY_MESSAGE}`,
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
      message: `The scraper was stopped. ${RETRY_MESSAGE}`,
    });
    // don't use async/await because we don't want to wait for other processes
    // immediately shut down puppeteer
    page.close();
  });

  // navigate to Facebook
  log.info('Going to facebook.com');
  ipc.send('status', {
    statusCode: 2,
    message: 'Navigating to the website...',
  });
  await page.goto('https://www.facebook.com').catch(async err => {
    log.error(`Error: ${err}`);
    ipc.send('status', {
      statusCode: 99,
      message:
        'Error navigating to https://www.facebook.com.  Is there a problem ' +
        'with your Internet connection or is there something preventing ' +
        'you from going to this site in your browser?',
    });
    await page.close();
  });

  // Submit login
  log.info('Logging in');
  ipc.send('status', {
    statusCode: 3,
    message:
      'This will only work if you provided the correct email and password.',
  });
  await page.focus('#email');
  await page.keyboard.type(username);
  const $passField = await page.$('input#pass');
  await $passField.type(password);
  await $passField.press('Enter');

  const $profileLink = await page
    .waitForSelector('div[data-click="profile_icon"] a', { timeout: 10000 })
    .catch(async () => {
      await page
        .waitForSelector(
          '[href^="https://www.facebook.com/recover/initiate"]',
          { timeout: 5000 }
        )
        .then(async () => {
          log.error('login credentails incorrect');
          ipc.send('status', {
            statusCode: 99,
            message: 'The login credentials are incorrect',
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

  if (!$profileLink) {
    return;
  }

  await $profileLink.click();

  // Go to Profile page from Homepage
  log.info('Going to your profile page');
  ipc.send('status', {
    statusCode: 4,
    message: 'We need to go here to get to your Photos page.',
  });

  // Go to "Photos of You" page
  log.info('Going to "Photos of You" page');
  ipc.send('status', {
    statusCode: 5,
    message: 'How else would we find your photos?',
  });
  const $photosLink = await page
    .waitForSelector('a[data-tab-key="photos"]')
    .catch(async () => {
      log.error('Couldn\'t find a[data-tab-key="photos"] selector on homepage');
      ipc.send('status', {
        statusCode: 99,
        message:
          'The page is missing a required, expected link.  Please let the developer of this app know about this issue.',
      });
      await page.close();
    });

  if (!$photosLink) {
    return;
  }
  await $photosLink.click();

  const $photosOfYou = await page
    .waitForSelector('a[name="Photos of You"]')
    .catch(async () => {
      log.error('Couldn\'t find a[name="Photos of You"] selector on homepage');
      ipc.send('status', {
        statusCode: 99,
        message:
          'The page is missing a required, expected link.  Please let the developer of this app know about this issue.',
      });
      await page.close();
    });

  if (!$photosOfYou) {
    return;
  }

  // scrape photos
  log.info('Searching for photos');
  ipc.send('status', {
    statusCode: 6,
    message: 'Now for the important stuff.',
  });
  const $taggedPhotos = await infiniteScrollPhotos(page, ipc);
  if (photoStartIndex > $taggedPhotos.length) {
    log.error(
      'The number of the photo the user requested to start at was higher ' +
        "than the number of the user's tagged photos"
    );
    ipc.send('status', {
      statusCode: 99,
      message:
        'The number of the photo you requested to start at was ' +
        'higher than the number of tagged photos found',
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
      message: 'Congratulations! All photos have been downloaded successfully!',
    });
  }

  // stop puppeteer
  log.info('Stopping puppeteer');
  await page.close();
}

module.exports = scrape;
