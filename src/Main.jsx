import React from 'react';
import PropTypes from 'prop-types';

function Main({
  photosDownloadedCount,
  photosDownloadedSmall,
  photosTotal,
  statusFriendly,
  statusInternal,
  startScraper
}) {
  const buttonText = (statusInternal === 'crashed') ? 'Retry' : 'Start';
  return (
    <>
      <p>Current status: {statusFriendly}</p>
      <p>Internal status: {statusInternal}</p>
      <p>Photos found: {photosTotal}</p>
      <p>Photos downloaded: {photosDownloadedCount}</p>
      {statusInternal === 'complete' ? (<h2>Complete!</h2>) : (
        <button
          disabled={statusInternal === 'running'}
          onClick={startScraper}
        >
          {buttonText}
        </button>
      )}
      <p>{`Downloaded photos with small file sizes: ${photosDownloadedSmall.length}`}</p>
      <ul>
        {photosDownloadedSmall.map(photo => (
          <li>{`#${photo.index} - ${photo.url}`}</li>
        ))}
      </ul>
    </>
  )
}

Main.propTypes = {
  photosDownloadedCount: PropTypes.number.isRequired,
  photosDownloadedSmall: PropTypes.arrayOf(
    PropTypes.exact({
      index: PropTypes.number.isRequired,
      url: PropTypes.string.isRequired,
    })
  ),
  photosTotal: PropTypes.number.isRequired,
  statusFriendly: PropTypes.string.isRequired,
  statusInternal: PropTypes.string.isRequired,
  startScraper: PropTypes.func.isRequired,
};
Main.defaultProps = {
  photosDownloadedSmall: [],
};

export default Main;
