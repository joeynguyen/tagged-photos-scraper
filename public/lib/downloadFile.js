const { app } = require('electron');
const { download } = require('electron-dl');
const log = require('electron-log');

const { statusSuccess } = require('./statusTypes.js');

function downloadFile(
  url,
  filename,
  iter,
  totalPhotosCount,
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
      if (iter + 1 === totalPhotosCount) {
        log.warn('SUCCESSFUL RUN');
        ipc.send('status', statusSuccess());
      }
    })
    .catch(async err => {
      ipc.send('photo-download-failed', iter + 1);
      const errMessage = `Downloading failed at photo #${iter + 1}`;
      log.error(errMessage);
      log.error('error', err);
    });
}

module.exports = downloadFile;
