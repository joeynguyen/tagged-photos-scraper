const log = require('electron-log');

const downloadFile = require('./downloadFile.js');
const RETRY_MESSAGE =
  'If you would like to continue downloading ' +
  'where you left off, click the "Retry" button.';

async function downloadAllPhotos(
  photoStartIndex,
  $photos,
  page,
  browser,
  ipc,
  electronWindow
) {
  ipc.send('status', {
    statusCode: 9,
    message:
      'Getting the full quality version of your photos and downloading them.',
  });

  for (let i = photoStartIndex; i < $photos.length; i++) {
    try {
      const $photo = $photos[i];
      const hrefPropertyHandle = await $photo.getProperty('href');
      const photoUrl = await hrefPropertyHandle.jsonValue();
      const newPhotoPage = await browser.newPage();
      await newPhotoPage.goto(photoUrl);

      // XPath to query text because "href" doesn't have a consistent pattern
      // can be "/photo/view_full_size"
      // or "https://scontent-dfw5-1.xx.fbcdn.net"
      const $fullSizeLink = await newPhotoPage.waitForXPath(
        '//a[text()="View Full Size"]',
        { timeout: 10000 }
      );
      const newPagePromise = new Promise(x => {
        return browser.once('targetcreated', target => x(target.page()));
      });
      await $fullSizeLink.click();
      const newPage = await newPagePromise;

      // having these `.waitFor(1000)` methods help
      // prevent Puppeteer scraping errors
      await newPhotoPage.waitFor(1000);
      await newPhotoPage.close();
      await newPage.waitFor(1000);
      const imageSrc = await newPage.url();

      // grab filename of image from URL
      const regx = /[a-zA-Z_0-9]*\.[a-zA-Z]{3,4}(?=\?)/;
      let filename = regx.exec(imageSrc)[0];
      // append index number + 1 in front of filename for user to
      // reference once they download in case tool fails while running
      filename = `${i + 1}-${filename}`;

      await downloadFile(imageSrc, filename, i, page, ipc, electronWindow);
      await newPage.close();

      // stop referencing the element handle
      $photo.dispose();
    } catch (e) {
      log.error(`error: ${e}`);
      ipc.send('status', {
        statusCode: 99,
        message: `Downloading failed before all photos were downloaded. ${RETRY_MESSAGE}`,
      });
      await page.close();
    }
  }
}

module.exports = downloadAllPhotos;
