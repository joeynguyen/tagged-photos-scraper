import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'grommet';

function Main({
  logFileLocation,
  photosDownloadedCount,
  photosTotal,
  statusFriendly,
  statusInternal,
}) {
  return (
    <>
      <Text size="xlarge">Current status: {statusFriendly}</Text>
      <Text size="xlarge">Internal status: {statusInternal}</Text>
      <Text size="xlarge">Photos found: {photosTotal}</Text>
      <Text size="xlarge">Photos downloaded: {photosDownloadedCount}</Text>
      {logFileLocation && (
        <Text size="large">
          The location of the log file on this computer is: {logFileLocation}
        </Text>
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
