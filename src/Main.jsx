import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';

function Main({
  downloadFolderLocation,
  openDownloadFolder,
  logFileLocation,
  photosDownloadedCount,
  photosTotal,
  status,
}) {
  let statusInternal;
  const { message, statusCode } = status;
  switch (true) {
    case statusCode === 0:
      statusInternal = 'ready';
      break;
    case statusCode < 98:
      statusInternal = 'running';
      break;
    case statusCode === 98:
      statusInternal = 'crashed';
      break;
    case statusCode === 99:
      statusInternal = 'failed';
      break;
    case statusCode === 100:
      statusInternal = 'complete';
      break;
    default:
      statusInternal = 'ready';
  }
  return (
    <>
      <h3>Current status: {message}</h3>
      <h3>Internal status: {statusInternal}</h3>
      <h3>Photos found: {photosTotal}</h3>
      <h3>Photos downloaded: {photosDownloadedCount}</h3>
      {logFileLocation && (
        <h3>
          The location of the log file on this computer is: {logFileLocation}
        </h3>
      )}
      {downloadFolderLocation && photosDownloadedCount > 0 && (
        <Button
          variant="outlined"
          color="primary"
          type="button"
          onClick={openDownloadFolder}
        >
          Go to downloaded photos
        </Button>
      )}
    </>
  );
}

Main.propTypes = {
  downloadFolderLocation: PropTypes.string,
  openDownloadFolder: PropTypes.func.isRequired,
  logFileLocation: PropTypes.string,
  photosDownloadedCount: PropTypes.number.isRequired,
  photosTotal: PropTypes.number.isRequired,
  status: PropTypes.shape({
    statusCode: PropTypes.number.isRequired,
    message: PropTypes.string.isRequired,
  }).isRequired,
};
Main.defaultTypes = {
  downloadFolderLocation: null,
  logFileLocation: null,
};

export default Main;
