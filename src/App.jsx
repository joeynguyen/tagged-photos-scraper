import React, { Component } from 'react';
import './App.css';
import Main from './Main';
import ScraperSettings from './ScraperSettings';

const { ipcRenderer } = window.require('electron');
const log = window.require('electron-log');
const unhandled = window.require('electron-unhandled');

unhandled({
  logger: log.error,
});

class App extends Component {
  constructor(props) {
    super(props);
    this.runScraper = this.runScraper.bind(this);
    this.stopScraper = this.stopScraper.bind(this);
  }

  state = {
    photosDownloadedCount: 0,
    scraperStatusFriendly: {
      // -1: 'ready', 0: 'crashed', 1-98: 'running', 99: 'failed', 100: 'complete'
      statusCode: -1,
      message: 'Ready',
    },
    totalPhotosCount: 0,
    logFileLocation: '',
  };

  componentDidMount() {
    ipcRenderer.on('status-friendly', (event, status) => {
      this.setState({ scraperStatusFriendly: status });
    });

    ipcRenderer.on('photos-found', (event, num) => {
      this.setState({ totalPhotosCount: num });
    });

    ipcRenderer.on('photos-downloaded', (event, photoNumber) => {
      this.setState({ photosDownloadedCount: photoNumber });
    });
    ipcRenderer.on('log-file-location', (event, location) => {
      this.setState({ logFileLocation: location });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners();
  }

  runScraper(username, password, userRequestedPhotoIndexStart, visualMode) {
    let photoStartIndex = 0;
    const {
      scraperStatusFriendly: { statusCode },
      photosDownloadedCount,
    } = this.state;

    if (userRequestedPhotoIndexStart) {
      // non-developers start counting at 1, not 0
      photoStartIndex = userRequestedPhotoIndexStart - 1;
    } else if (
      (statusCode === 0 || statusCode === 99) &&
      photosDownloadedCount !== 0
    ) {
      // index starts at 0 so it's 1 behind the number downloaded
      // for example, if photo #2 was last downloaded successfully,
      // we restart at index 2 to begin downloading photo #3
      photoStartIndex = photosDownloadedCount;
    }

    ipcRenderer.send(
      'run-scraper',
      username,
      password,
      photoStartIndex,
      visualMode
    );
  }

  stopScraper() {
    ipcRenderer.send('stop-scraper');
  }

  render() {
    const {
      logFileLocation,
      photosDownloadedCount,
      scraperStatusFriendly,
      totalPhotosCount,
    } = this.state;
    return (
      <>
        <ScraperSettings
          statusFriendly={scraperStatusFriendly}
          startScraper={this.runScraper}
          stopScraper={this.stopScraper}
        />
        <Main
          logFileLocation={logFileLocation}
          photosDownloadedCount={photosDownloadedCount}
          photosTotal={totalPhotosCount}
          statusFriendly={scraperStatusFriendly}
        />
      </>
    );
  }
}

export default App;
