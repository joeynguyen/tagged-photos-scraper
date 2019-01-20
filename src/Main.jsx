import React from 'react';
import PropTypes from 'prop-types';

function Main({
  toggleVisualMode,
  visualMode,
  handleChangeUserPhotoStart,
  photoNumberDownloaded,
  photosDownloadedSmall,
  photosTotal,
  statusFriendly,
  statusInternal,
  startScraper,
  userRequestedPhotoIndexStart,
}) {
  const buttonText =
    statusInternal === 'crashed' || statusInternal === 'failure'
      ? 'Retry'
      : 'Start';

  return (
    <>
      <p>If you want to start at a certain photo number, enter it here:</p>
      <label htmlFor="userRequestedPhotoIndexStart">Photo number: </label>
      <input
        id="userRequestedPhotoIndexStart"
        type="number"
        onChange={handleChangeUserPhotoStart}
        value={userRequestedPhotoIndexStart || ''}
        placeholder="enter an integer"
        min={0}
      />
      <label htmlFor="visualMode">Enable Visual Mode?</label>
      <input
        id="visualMode"
        type="checkbox"
        onChange={toggleVisualMode}
        value={visualMode}
      />
      <p>Current status: {statusFriendly}</p>
      <p>Internal status: {statusInternal}</p>
      <p>Photos found: {photosTotal}</p>
      <p>Photo number downloaded: {photoNumberDownloaded}</p>
      {statusInternal === 'complete' ? (
        <h2>Complete!</h2>
      ) : (
        <button disabled={statusInternal === 'running'} onClick={startScraper}>
          {buttonText}
        </button>
      )}
      <p>{`Downloaded photos with small file sizes: ${
        photosDownloadedSmall.length
      }`}</p>
      <ul>
        {photosDownloadedSmall.map(photo => (
          <li>{`#${photo.index} - ${photo.url}`}</li>
        ))}
      </ul>
    </>
  );
}

Main.propTypes = {
  toggleVisualMode: PropTypes.func.isRequired,
  visualMode: PropTypes.bool.isRequired,
  handleChangeUserPhotoStart: PropTypes.func.isRequired,
  photoNumberDownloaded: PropTypes.number.isRequired,
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
  userRequestedPhotoIndexStart: PropTypes.number,
};
Main.defaultProps = {
  photosDownloadedSmall: [],
  userRequestedPhotoIndexStart: null,
};

export default Main;
