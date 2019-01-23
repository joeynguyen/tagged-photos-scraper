import React from 'react';
import PropTypes from 'prop-types';

function Main({
  logFileLocation,
  photosDownloadedCount,
  photosTotal,
  statusFriendly,
  statusInternal,
}) {
  return (
    <>
      <p>Current status: {statusFriendly}</p>
      <p>Internal status: {statusInternal}</p>
      <p>Photos found: {photosTotal}</p>
      <p>Photos downloaded: {photosDownloadedCount}</p>
      {logFileLocation && (
        <p>
          The location of the log file on this computer is: {logFileLocation}
        </p>
      )}
    </>
  );
}

Main.propTypes = {
  logFileLocation: PropTypes.string.isRequired,
  photosDownloadedCount: PropTypes.number.isRequired,
  photosTotal: PropTypes.number.isRequired,
  statusFriendly: PropTypes.string.isRequired,
  statusInternal: PropTypes.oneOf([
    'ready',
    'running',
    'crashed',
    'failed',
    'complete',
  ]).isRequired,
};

export default Main;
