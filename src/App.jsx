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
    this.handleChangeUserPhotoStart = this.handleChangeUserPhotoStart.bind(this);
  }

  state = {
    photoNumberDownloaded: 0,
    scraperStatusFriendly: 'Ready',
    scraperStatusInternal: 'ready', // one of ['ready', 'running', 'crashed', 'complete']
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

  handleChangeUserPhotoStart(e) {
    this.setState({ userRequestedPhotoIndexStart: e.target.value })
  }

  runScraper() {
    let photoStartIndex = 0;
    const { scraperStatusInternal, photoNumberDownloaded } = this.state;

    if (scraperStatusInternal === 'crashed' && photoNumberDownloaded !== 0) {
      // index starts at 0 so it's 1 behind the number downloaded
      // for example, if photo #2 was last downloaded successfully,
      // we restart at index 2 to begin downloading photo #3
      photoStartIndex = photoNumberDownloaded;
    }

    ipcRenderer.send('run-scraper', photoStartIndex);
  }

  render() {
    const {
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
            photoNumberDownloaded={photoNumberDownloaded}
            photosDownloadedSmall={smallPhotos}
            photosTotal={totalPhotosCount}
            statusFriendly={scraperStatusFriendly}
            statusInternal={scraperStatusInternal}
            startScraper={this.runScraper}
            userRequestedPhotoIndexStart={userRequestedPhotoIndexStart}
          />
        </header>
      </div>
    );
  }
}

export default App;
