const { app } = require('electron');
const { download } = require('electron-dl');
const log = require('electron-log');
const {
  RETRY_MESSAGE,
  statusFailed,
  statusSuccess,
} = require('./statusTypes.js');

function downloadFile(
  url,
  filename,
  iter,
  totalPhotosCount,
  page,
  ipc,
  electronWindow
) {
  download(electronWindow, url, {
    directory: app.getPath('downloads') + '/tagged-photos-scraper',
    filename,
  })
    .then(downloadItem => {
      const photosDownloaded = iter + 1;
      log.info(`Downloaded ${filename} successfully`);
      log.info(`${photosDownloaded} downloaded`);
      ipc.send('photos-downloaded', photosDownloaded);
      if (iter === totalPhotosCount) {
        log.warn('SUCCESSFUL RUN');
        ipc.send('status', statusSuccess());
      }
    })
    .catch(async err => {
      const errMessage = `Downloading failed at photo #${iter +
        1} before all photos were downloaded. ${RETRY_MESSAGE}`;
      log.error(errMessage);
      log.error('error', err);
      ipc.send('status', statusFailed(errMessage));
      await page.close();
    });
}

module.exports = downloadFile;
