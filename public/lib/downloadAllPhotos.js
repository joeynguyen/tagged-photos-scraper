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

      const $optionsButton = await newPhotoPage
        .waitForSelector('[data-action-type="open_options_flyout"]')
        .catch(async () => {
          log.error(
            'Couldn\'t find [data-action-type="open_options_flyout"] selector on homepage'
          );
          ipc.send('status', {
            statusCode: 99,
            message:
              'The page is missing a required, expected link.  Please let the developer of this app know about this issue.',
          });
          await page.close();
        });

      if (!$optionsButton) {
        return;
      }

      const imageSrc = await newPhotoPage
        .$eval('.fbPhotoSnowliftPopup img.spotlight', el => el.src)
        .catch(async () => {
          log.error(
            "Couldn't find '.fbPhotoSnowliftPopup img.spotlight' selector on homepage"
          );
          ipc.send('status', {
            statusCode: 99,
            message:
              'The page is missing a required, expected item.  Please let the developer of this app know about this issue.',
          });
          await page.close();
        });

      if (!imageSrc) {
        return;
      }

      // grab filename of image from URL
      const regx = /[a-zA-Z_0-9]*\.[a-zA-Z]{3,4}(?=\?)/;
      let filename = regx.exec(imageSrc)[0];
      // append index number + 1 in front of filename for user to
      // reference once they download in case tool fails while running
      filename = `${i + 1}-${filename}`;

      await downloadFile(imageSrc, filename, i, page, ipc, electronWindow);

      // stop referencing the element handle
      $photo.dispose();

      // having these `.waitFor(1000)` methods help
      // prevent Puppeteer scraping errors
      await newPhotoPage.waitFor(1000);
      await newPhotoPage.close();
    } catch (e) {
      log.error(`error: ${e}`);
      ipc.send('status', {
        statusCode: 99,
        message: `Downloading failed before all photos were retrieved successfully. ${RETRY_MESSAGE}`,
      });
      await page.close();
    }
  }
}

module.exports = downloadAllPhotos;
