import React, { Component } from 'react';
import './App.css';
const { ipcRenderer } = window.require('electron')

class App extends Component {
  constructor(props) {
    super(props);
    this.sendMessage = this.sendMessage.bind(this);
  }

  // state = {
  //   photoDownloadedName: null,
  //   photoDownloadedCount: 0,
  //   totalPhotosCount: 0,
  // }

  componentDidMount() {
    // Electron IPC example
    ipcRenderer.on('scraper-started', (event, arg) => {
      console.log(arg); // prints "scraper started"
    });
    ipcRenderer.on('photos-found', (event, num) => {
      console.log(num);
      console.log(`Photos found: ${num}`);
    });
    ipcRenderer.on('photos-downloaded', (event, photoNumber) => {
      console.log(`photoNumber: ${photoNumber}`);
    });
  }

  componentWillUnmount() {
    // Electron IPC example
    ipcRenderer.removeAllListeners();
  }

  sendMessage() {
    // Electron IPC example
    ipcRenderer.send('run-scraper', 'run scraper');
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p>
            Edit <code>src/App.jsx</code> and save to reload.
          </p>
          <button onClick={this.sendMessage}>Send ping</button>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
