import React, { Component } from 'react';
import './App.css';
import Main from './Main';
import ScraperSettings from './ScraperSettings';
import StatusSteps from './StatusSteps';

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
    scraperStatus: {
      // 0: 'ready', 1-97: 'running', 98: 'crashed', 99: 'failed', 100: 'complete'
      statusCode: 0,
      message: 'Fill out the form and click the Start/Retry  button to begin',
    },
    totalPhotosCount: 0,
    logFileLocation: '',
  };

  componentDidMount() {
    ipcRenderer.on('status', (event, status) => {
      this.setState({ scraperStatus: status });
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
      scraperStatus: { statusCode },
      photosDownloadedCount,
    } = this.state;

    if (userRequestedPhotoIndexStart) {
      // non-developers start counting at 1, not 0
      photoStartIndex = userRequestedPhotoIndexStart - 1;
    } else if (
      (statusCode === 98 || statusCode === 99) &&
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
      scraperStatus,
      totalPhotosCount,
    } = this.state;
    return (
      <>
        <ScraperSettings
          status={scraperStatus}
          startScraper={this.runScraper}
          stopScraper={this.stopScraper}
        />
        <StatusSteps
          photosFound={totalPhotosCount}
          photosDownloaded={photosDownloadedCount}
          status={scraperStatus}
        />
        <Main
          logFileLocation={logFileLocation}
          photosDownloadedCount={photosDownloadedCount}
          photosTotal={totalPhotosCount}
          status={scraperStatus}
        />
      </>
    );
  }
}

export default App;
