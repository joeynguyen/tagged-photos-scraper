const log = require('electron-log');

const downloadFile = require('./downloadFile.js');
const {
  statusGetFullPhotos,
  statusStopped,
  userForcedStop,
} = require('./statusTypes.js');

async function downloadAllPhotos(
  photoStartIndex,
  $photos,
  browser,
  ipc,
  electronWindow
) {
  log.info('Downloading all photos');
  ipc.send('status', statusGetFullPhotos());

  for (let i = photoStartIndex; i < $photos.length; i++) {
    const userFriendlyPhotoNumber = i + 1;

    try {
      const $photo = $photos[i];
      const hrefPropertyHandle = await $photo.getProperty('href');
      const photoUrl = await hrefPropertyHandle.jsonValue();
      const newPhotoPage = await browser.newPage();
      await newPhotoPage.goto(photoUrl);

      const $optionsButton = await newPhotoPage
        .waitForSelector('[data-action-type="open_options_flyout"]')
        .catch(async e => {
          if (userForcedStop(e.message)) {
            ipc.send('status', statusStopped());
            return;
          }
          log.error(
            `Couldn't find [data-action-type="open_options_flyout"] selector on photo #${userFriendlyPhotoNumber}`
          );
          await newPhotoPage.close();
        });

      if (!$optionsButton) {
        // Some photo URLs won't work if navigated to in a new tab
        // and will take the user to a page that says:
        // "The link you followed may be broken, or the page may have been removed.",
        // even though the photo works if the user clicks on the thumbnail.
        // There's nothing I can think of to do about this except
        // skip and move on to the next photo.
        ipc.send('photo-download-failed', userFriendlyPhotoNumber);
        throw new Error(
          `Couldn't find $optionsButton on photo #${userFriendlyPhotoNumber}`
        );
      }

      let imageSrc = await newPhotoPage
        .$eval('.fbPhotoSnowliftPopup img.spotlight', el => el.src)
        .catch(async e => {
          if (userForcedStop(e.message)) {
            ipc.send('status', statusStopped());
            return;
          }
          log.error(
            `Couldn't find '.fbPhotoSnowliftPopup img.spotlight' selector on photo #${userFriendlyPhotoNumber}`
          );
          await newPhotoPage.close();
        });

      if (!imageSrc) {
        ipc.send('photo-download-failed', userFriendlyPhotoNumber);
        throw new Error(
          `Couldn't find imageSrc on photo #${userFriendlyPhotoNumber}`
        );
      }

      // sometimes imageSrc will be a URL like
      // "https://static.xx.fbcdn.net/rsrc.php/v3/y4/r/-PAXP-deijE.gif"
      // which is a placeholder image until the full quality photo is loaded
      while (imageSrc.includes('.php')) {
        log.warn(`imageSrc includes .php: ${imageSrc}`);
        await newPhotoPage.waitFor(1000);
        imageSrc = await newPhotoPage
          .$eval('.fbPhotoSnowliftPopup img.spotlight', el => el.src)
          .catch(async e => {
            if (userForcedStop(e.message)) {
              ipc.send('status', statusStopped());
              return;
            }
            log.error(
              `Couldn't find '.fbPhotoSnowliftPopup img.spotlight' selector on photo #${userFriendlyPhotoNumber}`
            );
          });
      }

      // grab filename of image from URL
      const regx = /[a-zA-Z_0-9]*\.[a-zA-Z]{3,4}(?=\?)/;
      let filename = regx.exec(imageSrc) && regx.exec(imageSrc)[0];
      if (!filename) {
        ipc.send('photo-download-failed', userFriendlyPhotoNumber);
        throw new Error(
          `Couldn't find a filename on photo #${userFriendlyPhotoNumber}`
        );
      }
      // append index number + 1 in front of filename for user to
      // reference once they download in case tool fails while running
      filename = `${userFriendlyPhotoNumber}-${filename}`;

      await downloadFile(
        imageSrc,
        filename,
        i,
        $photos.length,
        ipc,
        electronWindow
      );

      // stop referencing the element handle
      $photo.dispose();

      // having these `.waitFor(1000)` methods help
      // prevent Puppeteer scraping errors
      await newPhotoPage.waitFor(1000);
      await newPhotoPage.close();
    } catch (e) {
      log.error(e);
    }
  }
}

module.exports = downloadAllPhotos;
