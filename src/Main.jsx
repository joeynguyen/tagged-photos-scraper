import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

function Main({ logFileLocation, openLogFileLocation }) {
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
    </div>
  );
}

Main.propTypes = {
  logFileLocation: PropTypes.string,
  openLogFileLocation: PropTypes.func.isRequired,
};
Main.defaultTypes = {
  logFileLocation: null,
};

export default Main;
