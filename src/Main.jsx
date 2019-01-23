import React from 'react';
import PropTypes from 'prop-types';

function Main({
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
    </>
  );
}

Main.propTypes = {
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
