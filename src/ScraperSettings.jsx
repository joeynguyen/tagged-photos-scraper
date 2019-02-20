import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
// material-ui
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

import FailedScrapeDialog from './FailedScrapeDialog';
import StopScraperConfirm from './StopScraperConfirm';

import * as yup from 'yup';
import PhotoIndexStartField from './PhotoIndexStartField';

const styles = theme => ({
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
    failedDownloadPhotos: PropTypes.array.isRequired,
    photosDownloadedCount: PropTypes.number.isRequired,
    status: PropTypes.shape({
      statusCode: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
    }).isRequired,
    startScraper: PropTypes.func.isRequired,
    stopScraper: PropTypes.func.isRequired,
  };

  state = {
    failedScrapeDialogVisible: false,
    passwordVisible: false,
    stopConfirmationVisible: false,
  };

  componentDidUpdate(prevProps) {
    const { statusCode } = this.props.status;
    if (statusCode !== prevProps.status.statusCode && statusCode === 99) {
      this.showFailedScrapeDialog();
    }
  }

  handleClickShowPassword = () => {
    this.setState(state => ({ passwordVisible: !state.passwordVisible }));
  };

  handleSubmit = values => {
    const {
      email,
      password,
      userRequestedPhotoIndexStart,
      visualMode,
    } = values;
    this.props.startScraper(
      email,
      password,
      userRequestedPhotoIndexStart,
      visualMode
    );
  };

  showStopConfirmation = () => {
    this.setState({ stopConfirmationVisible: true });
  };

  hideStopConfirmation = () => {
    this.setState({ stopConfirmationVisible: false });
  };

  showFailedScrapeDialog = () => {
    this.setState({ failedScrapeDialogVisible: true });
  };

  hideFailedScrapeDialog = () => {
    this.setState({ failedScrapeDialogVisible: false });
  };

  render() {
    const {
      classes,
      failedDownloadPhotos,
      photosDownloadedCount,
      status: { statusCode },
      stopScraper,
    } = this.props;
    // using statusCode > 1 because 1 is before puppeteer has initialized
    const scraperRunning = statusCode > 1 && statusCode < 98;
    const scraperFailed = statusCode === 98 || statusCode === 99;
    const scraperSuccess = statusCode === 100;
    const readyToStart = statusCode === 0 || scraperFailed;
    const buttonText = scraperFailed ? 'Retry' : 'Start';
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
          onSubmit={this.handleSubmit}
        >
          {({ submitForm, values }) => (
            <Form>
              <FailedScrapeDialog
                onClose={this.hideFailedScrapeDialog}
                isVisible={this.state.failedScrapeDialogVisible}
                retryScraper={submitForm}
              />
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
                      type={this.state.passwordVisible ? 'text' : 'password'}
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
                              {this.state.passwordVisible ? (
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
                      the scenes. Note that this mode may decrease
                      stability and performance so if you see issues,
                      don't use it."
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
              <PhotoIndexStartField
                photosDownloadedCount={photosDownloadedCount}
                statusCode={statusCode}
              />
              {readyToStart && (
                <Button variant="contained" color="primary" type="submit">
                  {buttonText}
                </Button>
              )}
              {scraperRunning && (
                <>
                  <Button
                    type="button"
                    variant="contained"
                    color="secondary"
                    onClick={this.showStopConfirmation}
                  >
                    Stop Scraper
                  </Button>
                  <Typography style={{ marginTop: '20px' }}>
                    Download starting at photo #
                    {values.userRequestedPhotoIndexStart || 1}
                  </Typography>
                </>
              )}
              {scraperSuccess && (
                <Typography variant="h5" color="primary">
                  Success!
                </Typography>
              )}{' '}
              {failedDownloadPhotos.length > 0 ? (
                <Typography style={{ marginTop: '10px' }}>
                  <span>Unable to download the following photos:</span>
                  <ul>
                    {failedDownloadPhotos.map(photo => (
                      <li>{photo}</li>
                    ))}
                  </ul>
                  <span>Please try downloading them manually yourself.</span>
                </Typography>
              ) : null}
              {scraperFailed && photosDownloadedCount > 0 ? (
                <Typography style={{ marginTop: '20px' }}>
                  The tool stopped running before all photos were downloaded.
                  Click the Retry button above to continue where you left off.
                  <br />
                  <br />
                  The last photo downloaded was: #{photosDownloadedCount}
                </Typography>
              ) : null}
            </Form>
          )}
        </Formik>
      </>
    );
  }
}

export default withStyles(styles)(ScraperSettings);
