import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Typography from '@material-ui/core/Typography';

function SuccessfulDownloadDialog({ onClose, successDialogVisible }) {
  return (
    <Dialog
      open={successDialogVisible}
      maxWidth="sm"
      aria-labelledby="successful-dialog-title"
    >
      <DialogTitle id="successful-dialog-title">
        Success! All photos downloaded!
      </DialogTitle>
      <DialogContent>
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
          And no need to send the developer money or anything, but if you would
          like to show your appreciation (and no worries if you don't), please
          make a donation of whatever amount you feel is appropriate to:
          <Typography color="primary">
            https://donate.doctorswithoutborders.org
          </Typography>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SuccessfulDownloadDialog.propTypes = {
  successDialogVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SuccessfulDownloadDialog;
