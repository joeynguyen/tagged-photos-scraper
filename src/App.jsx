import React, { Component } from 'react';
import './App.css';
import Main from './Main';
const { ipcRenderer } = window.require('electron')
const log = window.require('electron-log');
const unhandled = window.require('electron-unhandled');

unhandled({
  logger: log.error
});

class App extends Component {
  constructor(props) {
    super(props);
    this.runScraper = this.runScraper.bind(this);
  }

  state = {
    photoDownloadedCount: 0,
    scraperStatusFriendly: 'Ready',
    scraperStatusInternal: 'ready', // one of ['ready', 'running', 'crashed', 'complete']
    smallPhotos: [],
    totalPhotosCount: 0,
  }

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
      this.setState({ photoDownloadedCount: photoNumber });
    });

    ipcRenderer.on('small-filesize', (event, photoObj) => {
      this.setState({ smallPhotos: this.state.smallPhotos.concat(photoObj) });
    });
  }

  // componentDidUpdate(prevProps, prevState) {
  //   // automatically retry if app crashes
  //   if (
  //     prevState.scraperStatusInternal !== this.state.scraperStatusInternal &&
  //     this.state.scraperStatusInternal === 'crashed'
  //   ) {
  //     this.setState({ scraperStatusInternal: 'running' });
  //     this.setState({ scraperStatusFriendly: 'Restarting scraper' });
  //     this.runScraper();
  //   }
  // }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners();
  }

  runScraper() {
    let photoStartIndex = 0;
    const {
      scraperStatusInternal,
      photoDownloadedCount,
    } = this.state;

    if (
      scraperStatusInternal === 'crashed' &&
      photoDownloadedCount !== 0
    ) {
      // index starts at 0 so it's 1 behind downloaded count
      // for example, if 2 photos have been downloaded successfully,
      // we restart at index 2 to begin downloading photo #3
      photoStartIndex = photoDownloadedCount;
    }

    ipcRenderer.send('run-scraper', photoStartIndex);
  }

  render() {
    const {
      photoDownloadedCount,
      scraperStatusInternal,
      scraperStatusFriendly,
      smallPhotos,
      totalPhotosCount
    } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <Main
            photosDownloadedCount={photoDownloadedCount}
            photosDownloadedSmall={smallPhotos}
            photosTotal={totalPhotosCount}
            statusFriendly={scraperStatusFriendly}
            statusInternal={scraperStatusInternal}
            startScraper={this.runScraper}
          />
        </header>
      </div>
    );
  }
}

export default App;
