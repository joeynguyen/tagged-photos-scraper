import React from 'react';
import PropTypes from 'prop-types';
// material-ui
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';

function FailedScrapeDialog({ isVisible, onClose, retryScraper }) {
  function handleCancel() {
    onClose();
  }

  function handleOk() {
    retryScraper();
    onClose();
  }
  return (
    <Dialog
      open={isVisible}
      disableBackdropClick
      disableEscapeKeyDown
      maxWidth="sm"
      aria-labelledby="stop-confirmation-title"
    >
      <DialogTitle id="stop-confirmation-title">Download Failed</DialogTitle>
      <DialogContent>
        <Typography>
          Downloading failed before all photos were retrieved successfully.
          Would you like to retry from the last photo downloaded?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCancel} color="secondary">
          No
        </Button>
        <Button variant="contained" onClick={handleOk} color="primary">
          Retry
        </Button>
      </DialogActions>
    </Dialog>
  );
}

FailedScrapeDialog.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  retryScraper: PropTypes.func.isRequired,
};

export default FailedScrapeDialog;
