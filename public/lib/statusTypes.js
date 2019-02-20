const RETRY_MESSAGE =
  'If you would like to continue downloading ' +
  'where you left off, click the "Retry" button.';

function statusStarting(photoStartIndex) {
  return {
    statusCode: 1,
    message: `Starting with photo #${photoStartIndex +
      1}. This tool uses Google's Puppeteer library
      (https://developers.google.com/web/tools/puppeteer/)
      under the hood to download your photos.`,
  };
}

function statusNavToSite() {
  return {
    statusCode: 2,
    message: 'Navigating to the website...',
  };
}

function statusLoggingIn() {
  return {
    statusCode: 3,
    message:
      'This will only work if you provided the correct email and password.',
  };
}

function statusNavToProfile() {
  return {
    statusCode: 4,
    message: 'We need to go here to get to your Photos page.',
  };
}

function statusNavToPhotos() {
  return {
    statusCode: 5,
    message: 'How else would we find your photos?',
  };
}

function statusSearchingPhotos() {
  return {
    statusCode: 6,
    message: 'Now for the important stuff.',
  };
}

function statusInfiniteScroll() {
  return {
    statusCode: 7,
    message:
      'Facebook.com uses a feature called infinite scrolling to load ' +
      'additional photos as you scroll down the page. This tool imitates ' +
      'that scrolling behavior so that it can trigger the loading of ' +
      'additional photos.',
  };
}

function statusFoundAllPhotos() {
  return {
    statusCode: 8,
    message: 'Found all of your tagged photos',
  };
}

function statusGetFullPhotos() {
  return {
    statusCode: 9,
    message:
      'Getting the full quality version of your photos and downloading them.',
  };
}

function statusCrashed(err) {
  return {
    statusCode: 98,
    message: `The scraper crashed unexpectedly with an error: ${err}. ${RETRY_MESSAGE}`,
  };
}

function statusStopped() {
  return {
    statusCode: 99,
    message: `The scraper was stopped. ${RETRY_MESSAGE}`,
  };
}

function statusMissingElement() {
  return {
    statusCode: 99,
    message:
      'The page is missing a required, expected item. Please ' +
      'let the developer of this app know about this issue.',
  };
}

function statusFailed(message) {
  return {
    statusCode: 99,
    message,
  };
}

function statusSuccess() {
  return {
    statusCode: 100,
    message: 'Congratulations! All photos have been downloaded successfully!',
  };
}

function userForcedStop(message) {
  // closed is usually proceeded with either: "Target", "Session", or "Connection"
  return message.includes('Protocol error') && message.includes('closed');
}

module.exports = {
  RETRY_MESSAGE,
  statusStarting,
  statusNavToSite,
  statusLoggingIn,
  statusNavToProfile,
  statusNavToPhotos,
  statusSearchingPhotos,
  statusInfiniteScroll,
  statusFoundAllPhotos,
  statusGetFullPhotos,
  statusCrashed,
  statusStopped,
  statusMissingElement,
  statusFailed,
  statusSuccess,
  userForcedStop,
};
