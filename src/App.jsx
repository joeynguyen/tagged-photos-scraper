import React, { Component } from 'react';
import './App.css';
const { ipcRenderer } = window.require('electron')

class App extends Component {
  constructor(props) {
    super(props);
    this.sendMessage = this.sendMessage.bind(this);
  }

  componentDidMount() {
    // Electron IPC example
    ipcRenderer.on('asynchronous-reply', (event, arg) => {
      console.log(arg) // prints "pong"
    });
  }

  componentWillUnmount() {
    // Electron IPC example
    ipcRenderer.removeAllListeners('asynchronous-reply');
  }

  sendMessage() {
    // Electron IPC example
    ipcRenderer.send('asynchronous-message', 'ping');
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
