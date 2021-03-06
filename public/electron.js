// Modules to control application life and create native browser window
const electron = require('electron');
const { app, BrowserWindow, ipcMain, Menu, session } = electron;
const path = require('path');
const isDev = require('electron-is-dev');
const log = require('electron-log');
const unhandled = require('electron-unhandled');

const scrape = require('./lib/scrape.js');

unhandled({
  showDialog: false,
  logger: log.error,
});

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
    .then(name => log.info(`Added Extensions: ${name}`))
    .catch(err => log.error('An error occurred: ', err));
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // get the user's computer screen resolution
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app if app is packaged
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000' // Dev server ran by react-scripts
      : `file://${path.join(__dirname, '/index.html')}` // Bundled application
  );
  // Open the DevTools.
  isDev && mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.once('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function createMenu() {
  const application = {
    label: 'Application',
    submenu: [
      {
        label: 'About Application',
        selector: 'orderFrontStandardAboutPanel:',
      },
      {
        type: 'separator',
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  };

  const edit = {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:',
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:',
      },
      {
        type: 'separator',
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:',
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:',
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:',
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:',
      },
    ],
  };

  const template = [application, edit];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.once('ready', async () => {
  if (isDev) {
    await installExtensions();
  }
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' http://localhost:3000 ws://localhost:3000",
        ],
      },
    });
  });
  createWindow();
  if (process.platform === 'darwin') {
    // only required for Mac app to have copy/paste functionality once packaged
    createMenu();
  }
});

// Quit when all windows are closed.
app.once('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.once('activate', function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on(
  'run-scraper',
  (event, username, password, photoStartIndex, visualMode) => {
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
    const visualModeOptions = {
      enabled: visualMode,
      width,
      height,
    };

    const downloadFolder = app.getPath('downloads') + '/tagged-photos-scraper/';
    event.sender.send('download-folder', downloadFolder);
    log.info(`Starting scraper at photoStartIndex: ${photoStartIndex}`);

    scrape(
      username,
      password,
      photoStartIndex,
      visualModeOptions,
      event.sender,
      mainWindow
    );
  }
);
