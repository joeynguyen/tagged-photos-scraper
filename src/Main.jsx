import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

function Main({
  logFileLocation,
  openLogFileLocation,
  photosDownloadedCount,
  photosTotal,
}) {
  const isSuccessful = photosTotal > 0 && photosTotal === photosDownloadedCount;
  return (
    <div style={{ marginTop: '10px' }}>
      <Typography variant="subtitle1">
        If you have any questions, problems, or feedback, please send them to:{' '}
        <Typography inline color="primary">
          email@email.com
        </Typography>
        <br />
        <br />
        Including screenshots of your problem in the email would be especially
        helpful.
      </Typography>
      {logFileLocation && (
        <>
          <br />
          <Typography variant="subtitle1">
            If the tool crashed or failed while you were trying to download your
            photos, please include the log file in your email. The log file is
            located on this computer at: {logFileLocation}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            type="button"
            onClick={openLogFileLocation}
          >
            Go to log file
          </Button>
        </>
      )}
      <br />
      <br />
      {isSuccessful && (
        <Typography variant="subtitle1">
          Are you excited about having all of your photos downloaded to your
          computer?
          <br />
          Are you overjoyed by all of the time you saved versus downloading them
          manually yourself?
          <br />
          <br />
          If you answered "yes" to both questions, this tool has served its
          purpose. Nothing else to do here. Feel free to quit this program and
          go about the rest of your day.
          <br />
          <br />
          No need to send me money or anything (I won't accept it), but if
          you're feeling especially appreciative and generous (and no pressure
          if you're not), feel free to make a donation of whatever amount you
          feel is appropriate to:
          <Typography color="primary">
            https://donate.doctorswithoutborders.org/
          </Typography>
        </Typography>
      )}
    </div>
  );
}

Main.propTypes = {
  logFileLocation: PropTypes.string,
  openLogFileLocation: PropTypes.func.isRequired,
  photosDownloadedCount: PropTypes.number.isRequired,
  photosTotal: PropTypes.number.isRequired,
};
Main.defaultTypes = {
  logFileLocation: null,
};

export default Main;
