const log = require('electron-log');
const {
  statusFoundAllPhotos,
  statusInfiniteScroll,
  statusStopped,
  userForcedStop,
} = require('./statusTypes.js');

async function infiniteScrollPhotos(page, ipc, scrollDelay = 1000) {
  const photosQuerySelector =
    'ul.fbPhotosRedesignBorderOverlay > li > a.uiMediaThumb';
  let $taggedPhotos = await page.$$(photosQuerySelector);
  log.info(`Found ${$taggedPhotos.length} photos`);
  ipc.send('photos-found', $taggedPhotos.length);

  try {
    let previousHeight = 0;
    let currentHeight = await page.evaluate('document.body.scrollHeight');

    ipc.send('status', statusInfiniteScroll());
    // keep scrolling to the bottom of the page until there are no more photos to load
    while (previousHeight < currentHeight) {
      previousHeight = currentHeight;
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(
        `document.body.scrollHeight > ${previousHeight}`,
        { timeout: 10000 }
      );
      currentHeight = await page.evaluate('document.body.scrollHeight');
      await page.waitFor(scrollDelay);
      $taggedPhotos = await page.$$(photosQuerySelector);
      log.info(`Found ${$taggedPhotos.length} photos`);
      ipc.send('photos-found', $taggedPhotos.length);
      log.info('Scrolling down the page to load more photos');
    }
  } catch (e) {
    if (userForcedStop(e.message)) {
      ipc.send('status', statusStopped());
      return;
    }
    // there will be an error thrown once the page can't scroll down any further
    // since there aren't any more photos left to load
    // do nothing with the error
    log.info("Can't scroll down anymore");
    ipc.send('status', statusFoundAllPhotos());
  }

  $taggedPhotos = await page.$$(photosQuerySelector);
  log.info(`Final count: ${$taggedPhotos.length} tagged photos found.`);
  ipc.send('photos-found', $taggedPhotos.length);

  return $taggedPhotos;
}

module.exports = infiniteScrollPhotos;
