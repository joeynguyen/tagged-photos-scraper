import React from 'react';
import PropTypes from 'prop-types';
// material-ui
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';

function SuccessfulDownloadDialog({
  failedDownloadPhotos,
  onClose,
  successDialogVisible,
}) {
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
        {failedDownloadPhotos.length > 0 ? (
          <Typography variant="subtitle1">
            <span>
              However, this tool was unable to download the following photos:
            </span>
            <ul>
              {failedDownloadPhotos.map(photo => (
                <li>{photo}</li>
              ))}
            </ul>
            <span>Please try downloading them manually yourself.</span>
          </Typography>
        ) : null}
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
          However, if you would like to show your appreciation (no pressure!),
          feel free to make a donation in the amount of your choice to:
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
  failedDownloadPhotos: PropTypes.array.isRequired,
  successDialogVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SuccessfulDownloadDialog;
