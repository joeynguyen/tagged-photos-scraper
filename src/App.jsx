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
    photoNumberDownloaded: 0,
    scraperStatusFriendly: 'Ready',
    scraperStatusInternal: 'ready', // one of ['ready', 'running', 'crashed', 'failed', complete']
    smallPhotos: [],
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

    ipcRenderer.on('photo-number-downloaded', (event, photoNumber) => {
      this.setState({ photoNumberDownloaded: photoNumber });
    });

    ipcRenderer.on('small-filesize', (event, photoObj) => {
      this.setState({ smallPhotos: this.state.smallPhotos.concat(photoObj) });
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
      photoNumberDownloaded,
      userRequestedPhotoIndexStart,
      visualMode,
    } = this.state;

    if (userRequestedPhotoIndexStart !== null) {
      photoStartIndex = userRequestedPhotoIndexStart;
    } else if (
      (scraperStatusInternal === 'crashed' ||
        scraperStatusInternal === 'failure') &&
      photoNumberDownloaded !== 0
    ) {
      // index starts at 0 so it's 1 behind the number downloaded
      // for example, if photo #2 was last downloaded successfully,
      // we restart at index 2 to begin downloading photo #3
      photoStartIndex = photoNumberDownloaded;
    }

    ipcRenderer.send('run-scraper', photoStartIndex, visualMode);
  }

  stopScraper() {
    ipcRenderer.send('stop-scraper');
  }

  render() {
    const {
      visualMode,
      photoNumberDownloaded,
      scraperStatusInternal,
      scraperStatusFriendly,
      smallPhotos,
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
            photoNumberDownloaded={photoNumberDownloaded}
            photosDownloadedSmall={smallPhotos}
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
