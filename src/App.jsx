import React, { Component } from 'react';
import './App.css';
import Main from './Main';
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
    this.toggleVisualMode = this.toggleVisualMode.bind(this);
    this.handleChangeUserPhotoStart = this.handleChangeUserPhotoStart.bind(
      this
    );
  }

  state = {
    visualMode: false,
    photosDownloadedCount: 0,
    scraperStatusFriendly: 'Ready',
    scraperStatusInternal: 'ready', // one of ['ready', 'running', 'crashed', 'failed', 'complete']
    totalPhotosCount: 0,
    userRequestedPhotoIndexStart: null,
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

  toggleVisualMode() {
    this.setState({
      visualMode: !this.state.visualMode,
    });
  }

  handleChangeUserPhotoStart(e) {
    this.setState({
      userRequestedPhotoIndexStart: parseInt(e.target.value, 10),
    });
  }

  runScraper() {
    let photoStartIndex = 0;
    const {
      scraperStatusInternal,
      photosDownloadedCount,
      userRequestedPhotoIndexStart,
      visualMode,
    } = this.state;

    if (
      userRequestedPhotoIndexStart !== null &&
      !isNaN(userRequestedPhotoIndexStart)
    ) {
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
      visualMode,
      photosDownloadedCount,
      scraperStatusInternal,
      scraperStatusFriendly,
      totalPhotosCount,
      userRequestedPhotoIndexStart,
    } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <Main
            toggleVisualMode={this.toggleVisualMode}
            visualMode={visualMode}
            handleChangeUserPhotoStart={this.handleChangeUserPhotoStart}
            photosDownloadedCount={photosDownloadedCount}
            photosTotal={totalPhotosCount}
            statusFriendly={scraperStatusFriendly}
            statusInternal={scraperStatusInternal}
            startScraper={this.runScraper}
            stopScraper={this.stopScraper}
            userRequestedPhotoIndexStart={userRequestedPhotoIndexStart}
          />
        </header>
      </div>
    );
  }
}

export default App;
