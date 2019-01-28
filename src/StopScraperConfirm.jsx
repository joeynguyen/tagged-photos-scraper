import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Typography from '@material-ui/core/Typography';

function StopScraperConfirm({ onClose, stopConfirmationVisible, stopScraper }) {
  function handleCancel() {
    onClose();
  }

  function handleOk() {
    stopScraper();
    onClose();
  }
  return (
    <Dialog
      open={stopConfirmationVisible}
      disableBackdropClick
      disableEscapeKeyDown
      maxWidth="sm"
      aria-labelledby="confirmation-dialog-title"
    >
      <DialogTitle id="confirmation-dialog-title">Are you sure?</DialogTitle>
      <DialogContent>
        <Typography>
          Stopping the scraper will stop the downloading of your photos.
          However, this tool keeps track of the last photo you downloaded so if
          you do stop it, you can click the "Retry" button to pick up where you
          left off. You can also choose which photo number you wish to continue
          from using the field in the form.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCancel} color="primary">
          No, I changed my mind
        </Button>
        <Button variant="contained" onClick={handleOk} color="secondary">
          Yes, stop the scraper
        </Button>
      </DialogActions>
    </Dialog>
  );
}

StopScraperConfirm.propTypes = {
  stopConfirmationVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  stopScraper: PropTypes.func.isRequired,
};

export default StopScraperConfirm;
