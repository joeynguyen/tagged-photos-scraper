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
    const {
      scraperStatus: { statusCode },
      photosDownloadedCount,
    } = this.state;

    if (userRequestedPhotoIndexStart) {
      // non-developers start counting at 1, not 0
      photoStartIndex = userRequestedPhotoIndexStart - 1;
    } else if (
      (statusCode === 98 || statusCode === 99) &&
      photosDownloadedCount !== 0
    ) {
      // index starts at 0 so it's 1 behind the number downloaded
      // for example, if photo #2 was last downloaded successfully,
      // we restart at index 2 to begin downloading photo #3
      photoStartIndex = photosDownloadedCount;
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
      logFileLocation,
      photosDownloadedCount,
      scraperStatus,
      totalPhotosCount,
    } = this.state;
    const { statusCode } = scraperStatus;
    const searchingForPhotos = statusCode > 0 && statusCode < 8;
    const foundAllPhotos =
      statusCode === 8 || statusCode === 9 || statusCode === 100;
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
              photosFound={totalPhotosCount}
              photosDownloaded={photosDownloadedCount}
              status={scraperStatus}
            />
          </Grid>
          <Grid item xs={3}>
            <ScraperSettings
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
