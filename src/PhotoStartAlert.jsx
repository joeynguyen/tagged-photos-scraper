import React from 'react';
import PropTypes from 'prop-types';
// material-ui
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
// icons
import CloseIcon from '@material-ui/icons/Close';

function PhotoStartAlert({ isVisible, onClose, startNumber }) {
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      open={isVisible}
      autoHideDuration={2000}
      onClose={onClose}
      ContentProps={{
        'aria-describedby': 'message-id',
      }}
      message={
        <span id="message-id">Starting download at photo #{startNumber}</span>
      }
      action={[
        <IconButton
          key="close"
          aria-label="Close"
          color="inherit"
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>,
      ]}
    />
  );
}

PhotoStartAlert.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  startNumber: PropTypes.number.isRequired,
};

export default PhotoStartAlert;
