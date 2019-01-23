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
    scraperStatusFriendly: 'Ready',
    scraperStatusInternal: 'ready', // one of ['ready', 'running', 'crashed', 'failed', 'complete']
    totalPhotosCount: 0,
  };

  componentDidMount() {
    ipcRenderer.on('status-friendly', (event, status) => {
      this.setState({ scraperStatusFriendly: status });
    });

    ipcRenderer.on('status-internal', (event, status) => {
      this.setState({ scraperStatusInternal: status });
    });

    ipcRenderer.on('photos-found', (event, num) => {
      this.setState({ totalPhotosCount: num });
    });

    ipcRenderer.on('photos-downloaded', (event, photoNumber) => {
      this.setState({ photosDownloadedCount: photoNumber });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners();
  }

  runScraper(userRequestedPhotoIndexStart, visualMode) {
    let photoStartIndex = 0;
    const { scraperStatusInternal, photosDownloadedCount } = this.state;

    if (userRequestedPhotoIndexStart) {
      // non-developers start counting at 1, not 0
      photoStartIndex = userRequestedPhotoIndexStart - 1;
    } else if (
      (scraperStatusInternal === 'crashed' ||
        scraperStatusInternal === 'failed') &&
      photosDownloadedCount !== 0
    ) {
      // index starts at 0 so it's 1 behind the number downloaded
      // for example, if photo #2 was last downloaded successfully,
      // we restart at index 2 to begin downloading photo #3
      photoStartIndex = photosDownloadedCount;
    }

    ipcRenderer.send('run-scraper', photoStartIndex, visualMode);
  }

  stopScraper() {
    ipcRenderer.send('stop-scraper');
  }

  render() {
    const {
      photosDownloadedCount,
      scraperStatusInternal,
      scraperStatusFriendly,
      totalPhotosCount,
    } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <ScraperSettings
            statusInternal={scraperStatusInternal}
            startScraper={this.runScraper}
            stopScraper={this.stopScraper}
          />
          <Main
            photosDownloadedCount={photosDownloadedCount}
            photosTotal={totalPhotosCount}
            statusFriendly={scraperStatusFriendly}
            statusInternal={scraperStatusInternal}
          />
        </header>
      </div>
    );
  }
}

export default App;
