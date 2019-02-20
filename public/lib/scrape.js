const puppeteer = require('puppeteer');
const log = require('electron-log');
const { ipcMain } = require('electron');

const downloadAllPhotos = require('./downloadAllPhotos.js');
const infiniteScrollPhotos = require('./infiniteScrollPhotos.js');
const {
  statusStarting,
  statusNavToSite,
  statusLoggingIn,
  statusNavToProfile,
  statusNavToPhotos,
  statusSearchingPhotos,
  statusCrashed,
  statusStopped,
  statusMissingElement,
  statusFailed,
} = require('./statusTypes.js');

function getChromiumExecPath() {
  // https://github.com/GoogleChrome/puppeteer/issues/2134#issuecomment-408221446
  // let chromiumPath = puppeteer.executablePath();
  // if (process.platform === 'darwin') {
  //   chromiumPath = chromiumPath.replace('app.asar', 'app.asar.unpacked');
  // }
  // return chromiumPath;
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
  ipc.send('status', statusStarting(photoStartIndex));
  ipc.send('log-file-location', log.transports.file.findLogPath());

  const { enabled, width, height } = visualModeOptions;
  // start puppeteer
  const browser = await puppeteer.launch({
    headless: !enabled,
    defaultViewport: {
      width: enabled ? width : 3440,
      height: enabled ? height : 3440,
    },
    executablePath: getChromiumExecPath(),
    // even if the user's focus isn't on this app,
    // don't throttle this app's performance
    webPreferences: { backgroundThrottling: false },
  });

  // Go to website
  const page = await browser.newPage();
  page.once('close', async () => {
    log.info('page closed, closing browser as well');
    await browser.close();
  });

  // handle errors
  process.once('uncaughtException', async err => {
    log.error('process uncaughtException error', err);
    ipc.send('status', statusCrashed(err));
    await page.close();
  });
  page.once('pageerror', async err => {
    log.error('page uncaughtException error', err);
    ipc.send('status', statusCrashed(err));
    await page.close();
  });
  page.once('error', async err => {
    log.error('puppeteer page crash error', err);
    ipc.send('status', statusCrashed(err));
    await page.close();
  });
  browser.once('disconnected', async () => {
    log.warn('puppeteer browser disconnected');
    await browser.close();
  });
  ipcMain.once('stop-scraper', async () => {
    log.warn('puppeteer received a stop request');
    ipc.send('status', statusStopped());
    await page.close();
    await browser.close();
  });

  // navigate to Facebook
  log.info('Going to facebook.com');
  ipc.send('status', statusNavToSite());
  await page.goto('https://www.facebook.com').catch(async err => {
    log.error(`Error: ${err}`);
    ipc.send(
      'status',
      statusFailed(
        'Error navigating to https://www.facebook.com.  Is there a problem ' +
          'with your Internet connection or is there something preventing ' +
          'you from going to this site in your browser?'
      )
    );
    await page.close();
  });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.facebook.com', [
    'notifications',
  ]);

  // Submit login
  log.info('Logging in');
  ipc.send('status', statusLoggingIn());
  await page.focus('#email');
  await page.keyboard.type(username);
  const $passField = await page.$('input#pass');
  await $passField.type(password);
  await $passField.press('Enter');

  const $profileLink = await page
    .waitForSelector('div[data-click="profile_icon"] a', { timeout: 10000 })
    .catch(async e => {
      if (
        e.message === 'Protocol error (Runtime.callFunctionOn): Target closed.'
      ) {
        ipc.send('status', statusStopped());
        return;
      }

      await page
        .waitForSelector(
          '[href^="https://www.facebook.com/recover/initiate"]',
          { timeout: 5000 }
        )
        .then(async () => {
          log.error('login credentails incorrect');
          ipc.send(
            'status',
            statusFailed('The login credentials are incorrect')
          );
        })
        .catch(async e => {
          if (
            e.message ===
            'Protocol error (Runtime.callFunctionOn): Target closed.'
          ) {
            ipc.send('status', statusStopped());
            return;
          }

          log.error("Couldn't find profile_icon selector on homepage");
          ipc.send('status', statusMissingElement());
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
  ipc.send('status', statusNavToProfile());

  const $photosLink = await page
    .waitForSelector('a[data-tab-key="photos"]')
    .catch(async () => {
      log.error(
        'Couldn\'t find a[data-tab-key="photos"] selector on Profile page'
      );
      ipc.send('status', statusMissingElement());
      await page.close();
    });

  if (!$photosLink) {
    return;
  }
  // Go to Photos page
  log.info('Going to your Photos page');
  ipc.send('status', statusNavToPhotos());
  await $photosLink.click();

  const $photosOfYou = await page
    .waitForSelector('a[name="Photos of You"]')
    .catch(async () => {
      log.error(
        'Couldn\'t find a[name="Photos of You"] selector on Photos page'
      );
      ipc.send('status', statusMissingElement());
      await page.close();
    });

  if (!$photosOfYou) {
    return;
  }

  // scrape photos
  log.info('Searching for photos');
  ipc.send('status', statusSearchingPhotos());
  const $taggedPhotos = await infiniteScrollPhotos(page, ipc);
  if (photoStartIndex > $taggedPhotos.length) {
    log.error(
      'The number of the photo the user requested to start at ' +
        "was higher than the number of the user's tagged photos"
    );
    ipc.send(
      'status',
      statusFailed(
        'The number of the photo you requested to start at was ' +
          'higher than the number of tagged photos found'
      )
    );
  } else {
    await downloadAllPhotos(
      photoStartIndex,
      $taggedPhotos,
      browser,
      ipc,
      electronWindow
    );
  }

  await page.waitFor(1000);
  // stop puppeteer
  log.info('Stopping puppeteer');
  await page.close();
}

module.exports = scrape;
