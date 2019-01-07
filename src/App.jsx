import React, { Component } from 'react';
import './App.css';
const { ipcRenderer } = window.require('electron')

class App extends Component {
  constructor(props) {
    super(props);
    this.sendMessage = this.sendMessage.bind(this);
  }

  state = {
    scraperStatusInternal: 'ready', // one of ['ready', 'running', 'crashed', 'complete']
    scraperStatusFriendly: 'Ready',
    photoDownloadedCount: 0,
    totalPhotosCount: 0,
  }

  componentDidMount() {
    ipcRenderer.on('status-friendly', (event, status) => {
      console.log(status);
      this.setState({ scraperStatusFriendly: status });
    });

    ipcRenderer.on('photos-found', (event, num) => {
      console.log(num);
      console.log(`Photos found: ${num}`);
      this.setState({ totalPhotosCount: num });
   });

    ipcRenderer.on('photos-downloaded', (event, photoNumber) => {
      console.log(`photoNumber: ${photoNumber}`);
      this.setState({ photoDownloadedCount: photoNumber });
    });

    ipcRenderer.on('status-internal', (event, status) => {
      console.log('Internal status', status);
      this.setState({ scraperStatusInternal: status });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners();
  }

  sendMessage() {
    ipcRenderer.send('run-scraper', 'run scraper');
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p>Current status: {this.state.scraperStatusFriendly}</p>
          <p>Internal status: {this.state.scraperStatusInternal}</p>
          <p>Photos found: {this.state.totalPhotosCount}</p>
          <p>Photos downloaded: {this.state.photoDownloadedCount}</p>
          <button onClick={this.sendMessage}>Start</button>
        </header>
      </div>
    );
  }
}

export default App;
