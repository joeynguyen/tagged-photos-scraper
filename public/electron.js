// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const log = require('electron-log');
const unhandled = require('electron-unhandled');

const scrape = require('./scrape.js');

unhandled({
  logger: log.error
});
console.log('log file location', log.transports.file.findLogPath());

// install dev tools for debugging during development
const installExtensions = async () => {
  const {
    default: installExtension,
    REACT_DEVELOPER_TOOLS,
    // REDUX_DEVTOOLS,
  } = require('electron-devtools-installer');

  const extensions = [
    REACT_DEVELOPER_TOOLS,
    // REDUX_DEVTOOLS,
  ];

  await Promise.all(
    extensions.map(extension => {
      return new Promise(resolve => {
        resolve(installExtension(extension));
      });
    })
  )
    .then(name => console.log(`Added Extensions: ${name}`))
    .catch(err => console.log('An error occurred: ', err));
};


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(
      isDev
      ? 'http://localhost:3000' // Dev server ran by react-scripts
      : `file://${path.join(__dirname, '/index.html')}` // Bundled application
  );
  // Open the DevTools.
  isDev && mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDev) {
    await installExtensions();
  }
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('run-scraper', (event, photoStartIndex) => {
  log.info(`Starting scraper at photoStartIndex: ${photoStartIndex}`);
  event.sender.send('status-friendly', 'Started');
  event.sender.send('status-internal', 'running');
  scrape(photoStartIndex, event.sender, mainWindow);
});
