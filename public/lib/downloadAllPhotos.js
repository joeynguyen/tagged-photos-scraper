const log = require('electron-log');

const downloadFile = require('./downloadFile.js');
const {
  RETRY_MESSAGE,
  statusGetFullPhotos,
  statusMissingElement,
  statusFailed,
} = require('./statusTypes.js');

async function downloadAllPhotos(
  photoStartIndex,
  $photos,
  page,
  browser,
  ipc,
  electronWindow
) {
  log.info('Downloading all photos');
  ipc.send('status', statusGetFullPhotos());

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
            'Couldn\'t find [data-action-type="open_options_flyout"] selector on photo'
          );
          ipc.send('status', statusMissingElement());
          await page.close();
        });

      if (!$optionsButton) {
        return;
      }

      let imageSrc = await newPhotoPage
        .$eval('.fbPhotoSnowliftPopup img.spotlight', el => el.src)
        .catch(async () => {
          log.error(
            "Couldn't find '.fbPhotoSnowliftPopup img.spotlight' selector on photo"
          );
          ipc.send('status', statusMissingElement());
          await page.close();
        });

      // sometimes imageSrc will be a URL like
      // "https://static.xx.fbcdn.net/rsrc.php/v3/y4/r/-PAXP-deijE.gif"
      // which is a placeholder image until the full quality photo is loaded
      while (imageSrc.includes('.php')) {
        log.warn(`imageSrc includes .php: ${imageSrc}`);
        await newPhotoPage.waitFor(1000);
        imageSrc = await newPhotoPage
          .$eval('.fbPhotoSnowliftPopup img.spotlight', el => el.src)
          .catch(async () => {
            log.error(
              "Couldn't find '.fbPhotoSnowliftPopup img.spotlight' selector on photo"
            );
            ipc.send('status', statusMissingElement());
            await page.close();
          });
      }

      if (!imageSrc) {
        log.error("Couldn't find 'imageSrc' for the photo");
        ipc.send('status', statusMissingElement());
        await page.close();
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
      ipc.send(
        'status',
        statusFailed(
          `Downloading failed before all photos were retrieved successfully. ${RETRY_MESSAGE}`
        )
      );
      await page.close();
    }
  }
}

module.exports = downloadAllPhotos;
