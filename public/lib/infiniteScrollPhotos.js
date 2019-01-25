const log = require('electron-log');

async function infiniteScrollPhotos(page, ipc, scrollDelay = 1000) {
  const photosQuerySelector = '.timeline.photos a';
  let $taggedPhotos = await page.$$(photosQuerySelector);
  log.info(`Found ${$taggedPhotos.length} photos`);
  ipc.send('photos-found', $taggedPhotos.length);

  try {
    let previousHeight = 0;
    let currentHeight = await page.evaluate('document.body.scrollHeight');

    ipc.send('status-friendly', 'Scrolling down the page to load more photos');
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
    // there will be an error thrown once the page can't scroll down any further
    // since there aren't any more photos left to load
    // do nothing with the error
    log.info("Can't scroll down anymore");
    ipc.send('status-friendly', 'Found all of your tagged photos');
  }

  $taggedPhotos = await page.$$(photosQuerySelector);
  log.info(`Final count: ${$taggedPhotos.length} tagged photos found.`);
  ipc.send('photos-found', $taggedPhotos.length);

  return $taggedPhotos;
}

module.exports = infiniteScrollPhotos;