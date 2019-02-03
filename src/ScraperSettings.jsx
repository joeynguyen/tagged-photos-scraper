import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
// icons
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Email from '@material-ui/icons/Email';
import LockOpen from '@material-ui/icons/LockOpen';
import Photo from '@material-ui/icons/Photo';

import StopScraperConfirm from './StopScraperConfirm';

import * as yup from 'yup';

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  htmlTooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.90)',
    color: theme.palette.common.white,
    boxShadow: theme.shadows[1],
    fontSize: theme.typography.pxToRem(16),
    border: '1px solid #dadde9',
  },
  htmlTooltipSmall: {
    backgroundColor: 'rgba(0, 0, 0, 0.90)',
    color: theme.palette.common.white,
    boxShadow: theme.shadows[1],
    fontSize: theme.typography.pxToRem(16),
    border: '1px solid #dadde9',
    maxWidth: 230,
  },
});
const initialValues = {
  email: '',
  password: '',
  userRequestedPhotoIndexStart: '',
  visualMode: false,
};
const settingsSchema = yup.object().shape({
  email: yup
    .string()
    .email('Must be a valid email')
    .required('Required'),
  password: yup.string().required('Required'),
  userRequestedPhotoIndexStart: yup
    .number('Must be a number')
    .positive('Must be a positive number')
    .integer('Must be an integer'),
  visualMode: yup.bool(),
});

class ScraperSettings extends Component {
  static propTypes = {
    status: PropTypes.shape({
      statusCode: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
    }).isRequired,
    startScraper: PropTypes.func.isRequired,
    stopScraper: PropTypes.func.isRequired,
  };

  state = {
    showPassword: false,
    stopConfirmationVisible: false,
  };

  handleClickShowPassword = () => {
    this.setState(state => ({ showPassword: !state.showPassword }));
  };

  showStopConfirmation = () => {
    this.setState({ stopConfirmationVisible: true });
  };

  hideStopConfirmation = () => {
    this.setState({ stopConfirmationVisible: false });
  };

  render() {
    const {
      classes,
      status: { statusCode },
      startScraper,
      stopScraper,
    } = this.props;
    const buttonText =
      statusCode === 98 || statusCode === 99 ? 'Retry' : 'Start';
    return (
      <>
        <StopScraperConfirm
          onClose={this.hideStopConfirmation}
          stopConfirmationVisible={this.state.stopConfirmationVisible}
          stopScraper={stopScraper}
        />
        <Formik
          initialValues={initialValues}
          validationSchema={settingsSchema}
          onSubmit={values => {
            const {
              email,
              password,
              userRequestedPhotoIndexStart,
              visualMode,
            } = values;
            startScraper(
              email,
              password,
              userRequestedPhotoIndexStart,
              visualMode
            );
          }}
        >
          <Form>
            <Field
              type="text"
              name="email"
              render={({ field, form }) => {
                return (
                  <TextField
                    error={
                      form.touched[field.name] && form.errors[field.name]
                        ? true
                        : false
                    }
                    helperText={
                      form.touched[field.name] && form.errors[field.name]
                    }
                    {...field}
                    id={field.name}
                    type="text"
                    label="Email"
                    margin="normal"
                    variant="outlined"
                    style={{ marginBottom: '20px' }}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                );
              }}
            />
            <Field
              name="password"
              render={({ field, form }) => {
                return (
                  <TextField
                    {...field}
                    error={
                      form.touched[field.name] && form.errors[field.name]
                        ? true
                        : false
                    }
                    helperText={
                      form.touched[field.name] && form.errors[field.name]
                    }
                    id={field.name}
                    variant="outlined"
                    type={this.state.showPassword ? 'text' : 'password'}
                    label="Password"
                    style={{ marginBottom: '5px' }}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOpen />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="Toggle password visibility"
                            onClick={this.handleClickShowPassword}
                          >
                            {this.state.showPassword ? (
                              <Visibility />
                            ) : (
                              <VisibilityOff />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                );
              }}
            />
            <Field
              name="visualMode"
              render={({ field }) => {
                return (
                  <Tooltip
                    placement="right"
                    classes={{
                      tooltip: classes.htmlTooltipSmall,
                    }}
                    title="Allows you to see what this tool does behind
                    the scenes. Note that enabling this mode may decrease
                    stability and performance."
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                          color="primary"
                        />
                      }
                      label="Visual Mode"
                    />
                  </Tooltip>
                );
              }}
            />
            <Field
              type="number"
              name="userRequestedPhotoIndexStart"
              render={({ field, form }) => {
                return (
                  <Tooltip
                    placement="bottom"
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
                      helperText={
                        form.touched[field.name] && form.errors[field.name]
                      }
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
            {statusCode === 100 ? (
              <Typography variant="h5" color="primary">
                Success!
              </Typography>
            ) : (
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={statusCode > 0 && statusCode < 98}
              >
                {buttonText}
              </Button>
            )}{' '}
            {statusCode > 0 && statusCode < 98 && (
              <Button
                type="button"
                variant="contained"
                color="secondary"
                // onClick={stopScraper}
                onClick={this.showStopConfirmation}
              >
                Stop Scraper
              </Button>
            )}
          </Form>
        </Formik>
      </>
    );
  }
}

export default withStyles(styles)(ScraperSettings);
