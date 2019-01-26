const { app } = require('electron');
const { download } = require('electron-dl');
const log = require('electron-log');
const RETRY_MESSAGE =
  'If you would like to continue downloading ' +
  'where you left off, click the "Retry" button.';

function downloadFile(url, filename, iter, page, ipc, electronWindow) {
  download(electronWindow, url, {
    directory: app.getPath('downloads') + '/tagged-photos-scraper',
    filename,
  })
    .then(downloadItem => {
      const photosDownloaded = iter + 1;
      log.info(`Downloaded ${filename} successfully`);
      log.info(`${photosDownloaded} downloaded`);
      ipc.send('photos-downloaded', photosDownloaded);
    })
    .catch(async err => {
      const errMessage = `Downloading failed at photo #${iter +
        1} before all photos were downloaded. ${RETRY_MESSAGE}`;
      log.error(errMessage);
      log.error('error', err);
      ipc.send('status', {
        statusCode: 99,
        message: errMessage,
      });
      await page.close();
    });
}

module.exports = downloadFile;
