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
      <h3>Current status: {statusFriendly}</h3>
      <h3>Internal status: {statusInternal}</h3>
      <h3>Photos found: {photosTotal}</h3>
      <h3>Photos downloaded: {photosDownloadedCount}</h3>
      {logFileLocation && (
        <h3>
          The location of the log file on this computer is: {logFileLocation}
        </h3>
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
