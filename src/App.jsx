import React, { Component } from 'react';
import './App.css';
const { ipcRenderer } = window.require('electron')

class App extends Component {
  constructor(props) {
    super(props);
    this.runScraper = this.runScraper.bind(this);
  }

  state = {
    photoDownloadedCount: 0,
    scraperStatusFriendly: 'Ready',
    scraperStatusInternal: 'ready', // one of ['ready', 'running', 'crashed', 'complete']
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
  }

  // componentDidUpdate(prevProps, prevState) {
  //   // re-run scraper if it crashed
  //   if (
  //     prevState.scraperStatusInternal !== this.props.scraperStatusInternal &&
  //     this.props.scraperStatusInternal === 'crashed'
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

    if (
      this.props.scraperStatusInternal === 'crashed' &&
      this.state.photoDownloadedCount !== 0
    ) {
      // index starts at 0 so it's 1 behind downloaded count
      // for example, if 2 photos have been downloaded successfully,
      // we restart at index 2 to begin downloading photo #3
      photoStartIndex = this.state.photoDownloadedCount;
    }

    ipcRenderer.send('run-scraper', photoStartIndex);
  }

  render() {
    const {
      scraperStatusInternal,
      scraperStatusFriendly,
      photoDownloadedCount,
      totalPhotosCount
    } = this.state;
    const buttonText = (scraperStatusInternal === 'crashed') ? 'Retry' : 'Start';

    return (
      <div className="App">
        <header className="App-header">
          <p>Current status: {scraperStatusFriendly}</p>
          <p>Internal status: {scraperStatusInternal}</p>
          <p>Photos found: {totalPhotosCount}</p>
          <p>Photos downloaded: {photoDownloadedCount}</p>
          {scraperStatusInternal === 'complete' ? null : (
            <button
              disabled={scraperStatusInternal === 'running'}
              onClick={this.runScraper}
            >
              {buttonText}
            </button>
          )}
        </header>
      </div>
    );
  }
}

export default App;
