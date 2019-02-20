import React, { Component } from 'react';
// material-ui
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import 'typeface-roboto'; // used by material-ui

import Main from './Main';
import ScraperSettings from './ScraperSettings';
import StatusSteps from './StatusSteps';
import DisclaimerDialog from './DisclaimerDialog';

const { ipcRenderer, shell } = window.require('electron');
const log = window.require('electron-log');
const unhandled = window.require('electron-unhandled');

unhandled({
  showDialog: false,
  logger: log.error,
});

class App extends Component {
  constructor(props) {
    super(props);
    this.openLogFileLocation = this.openLogFileLocation.bind(this);
    this.openDownloadFolder = this.openDownloadFolder.bind(this);
    this.runScraper = this.runScraper.bind(this);
    this.stopScraper = this.stopScraper.bind(this);
  }

  state = {
    disclaimerDialogVisible: true,
    downloadFolderLocation: null,
    failedDownloadPhotos: [],
    logFileLocation: null,
    photosDownloadedCount: 0,
    scraperStatus: {
      // 0: 'ready', 1-97: 'running', 98: 'crashed', 99: 'failed', 100: 'complete'
      statusCode: 0,
      message: 'Fill out the form and click the Start/Retry  button to begin',
    },
    totalPhotosCount: 0,
  };

  componentDidMount() {
    ipcRenderer.on('status', (event, status) => {
      this.setState({ scraperStatus: status });
    });

    ipcRenderer.on('download-folder', (event, location) => {
      this.setState({ downloadFolderLocation: location });
    });

    ipcRenderer.on('photos-found', (event, num) => {
      this.setState({ totalPhotosCount: num });
    });

    ipcRenderer.on('photos-downloaded', (event, photoNumber) => {
      this.setState({ photosDownloadedCount: photoNumber });
    });

    ipcRenderer.on('photo-download-failed', (event, photoNumber) => {
      this.setState({
        failedDownloadPhotos: this.state.failedDownloadPhotos.concat(
          photoNumber
        ),
      });
    });

    ipcRenderer.on('log-file-location', (event, location) => {
      this.setState({ logFileLocation: location });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners();
  }

  hideDisclaimerDialog = () => {
    this.setState({ disclaimerDialogVisible: false });
  };

  openDownloadFolder() {
    shell.openItem(this.state.downloadFolderLocation);
  }

  openLogFileLocation() {
    shell.showItemInFolder(this.state.logFileLocation);
  }

  runScraper(username, password, userRequestedPhotoIndexStart, visualMode) {
    let photoStartIndex = 0;

    if (userRequestedPhotoIndexStart) {
      // non-developers start counting at 1, not 0
      photoStartIndex = userRequestedPhotoIndexStart - 1;
    }

    ipcRenderer.send(
      'run-scraper',
      username,
      password,
      photoStartIndex,
      visualMode
    );
  }

  stopScraper() {
    ipcRenderer.send('stop-scraper');
  }

  render() {
    const {
      disclaimerDialogVisible,
      downloadFolderLocation,
      failedDownloadPhotos,
      logFileLocation,
      photosDownloadedCount,
      scraperStatus,
      totalPhotosCount,
    } = this.state;
    const { statusCode } = scraperStatus;
    const searchingForPhotos = statusCode > 0 && statusCode < 8;
    const foundAllPhotos = statusCode >= 8;
    const calculateCompletion = value =>
      Math.floor((value * 100) / totalPhotosCount);
    return (
      <>
        {searchingForPhotos && (
          <>
            <LinearProgress />
            <Typography variant="body1" align="center" color="primary">
              {`${totalPhotosCount} photos found so far`}
            </Typography>
          </>
        )}
        {foundAllPhotos && (
          <>
            <LinearProgress
              variant="determinate"
              value={calculateCompletion(photosDownloadedCount)}
            />
            <Typography variant="body1" align="center" color="primary">
              {`Downloaded photo ${photosDownloadedCount} of ${totalPhotosCount}`}
            </Typography>
          </>
        )}
        <div style={{ marginTop: '20px' }} />
        <Grid container>
          <Grid item xs={4}>
            <StatusSteps
              failedDownloadPhotos={failedDownloadPhotos}
              photosFound={totalPhotosCount}
              photosDownloaded={photosDownloadedCount}
              status={scraperStatus}
            />
          </Grid>
          <Grid item xs={3}>
            <ScraperSettings
              failedDownloadPhotos={failedDownloadPhotos}
              photosDownloadedCount={photosDownloadedCount}
              status={scraperStatus}
              startScraper={this.runScraper}
              stopScraper={this.stopScraper}
            />
            {downloadFolderLocation && photosDownloadedCount > 0 && (
              <>
                <div style={{ marginTop: '15px' }} />
                <Button
                  variant="outlined"
                  color="primary"
                  type="button"
                  onClick={this.openDownloadFolder}
                >
                  Go to downloaded photos
                </Button>
              </>
            )}
          </Grid>
          <Grid item xs={1} />
          <Grid item xs={3}>
            <Main
              logFileLocation={logFileLocation}
              openLogFileLocation={this.openLogFileLocation}
            />
          </Grid>
        </Grid>
        <DisclaimerDialog
          onClose={this.hideDisclaimerDialog}
          isVisible={disclaimerDialogVisible}
        />
      </>
    );
  }
}

export default App;
