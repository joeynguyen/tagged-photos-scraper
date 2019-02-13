import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Field, connect } from 'formik';
import { withStyles } from '@material-ui/core/styles';
// material-ui
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
// icons
import Photo from '@material-ui/icons/Photo';

const styles = theme => ({
  htmlTooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.90)',
    color: theme.palette.common.white,
    boxShadow: theme.shadows[1],
    fontSize: theme.typography.pxToRem(16),
    border: '1px solid #dadde9',
  },
});

class PhotoIndexStartField extends Component {
  static propTypes = {
    photosDownloadedCount: PropTypes.number.isRequired,
    statusCode: PropTypes.number.isRequired,
  };

  componentDidUpdate(prevProps) {
    const { photosDownloadedCount, statusCode } = this.props;
    if (
      statusCode !== prevProps.statusCode &&
      statusCode === 99 &&
      photosDownloadedCount > 0
    ) {
      this.props.formik.setFieldValue(
        'userRequestedPhotoIndexStart',
        photosDownloadedCount + 1
      );
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <Field
        type="number"
        name="userRequestedPhotoIndexStart"
        render={({ field, form }) => {
          return (
            <Tooltip
              placement="right"
              classes={{
                tooltip: classes.htmlTooltip,
              }}
              title="By default, this tool downloads all of your tagged
              photos, starting with the first one it finds on your Photos
              page. However, you have the option to make it start at
              whichever number you wish. One use case may be - if this
              program crashes while you're using it, check the photos it
              downloaded in the 'tagged-photos-scraper' folder inside your
              computer's Downloads folder. Find the the highest number
              photo and begin downloading from that number."
            >
              <TextField
                {...field}
                error={
                  form.touched[field.name] && form.errors[field.name]
                    ? true
                    : false
                }
                helperText={form.touched[field.name] && form.errors[field.name]}
                id={field.name}
                type="number"
                label="Starting Photo Number (optional)"
                placeholder="1"
                margin="normal"
                variant="outlined"
                style={{ marginBottom: '20px' }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Photo />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          );
        }}
      />
    );
  }
}

export default connect(withStyles(styles)(PhotoIndexStartField));
