import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Email from '@material-ui/icons/Email';
import LockOpen from '@material-ui/icons/LockOpen';
import Photo from '@material-ui/icons/Photo';

import * as yup from 'yup';

const styles = theme => ({
  root: {
    flexGrow: 1,
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
    statusInternal: PropTypes.oneOf([
      'ready',
      'running',
      'crashed',
      'failed',
      'complete',
    ]).isRequired,
    startScraper: PropTypes.func.isRequired,
    stopScraper: PropTypes.func.isRequired,
  };

  state = {
    showPassword: false,
  };

  handleClickShowPassword = () => {
    this.setState(state => ({ showPassword: !state.showPassword }));
  };

  render() {
    const { classes, statusInternal, startScraper, stopScraper } = this.props;
    const buttonText =
      statusInternal === 'crashed' || statusInternal === 'failed'
        ? 'Retry'
        : 'Start';
    return (
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
          <Grid
            container
            className={classes.root}
            spacing={24}
            direction="column"
            alignItems="baseline"
          >
            <Grid item xs={12}>
              <Field
                type="text"
                name="email"
                render={({ field, form }) => {
                  return (
                    <TextField
                      error={
                        form.touched[field.name] && form.errors[field.name]
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
            </Grid>

            <Grid item xs={12}>
              <Field
                name="password"
                render={({ field, form }) => {
                  return (
                    <TextField
                      {...field}
                      error={
                        form.touched[field.name] && form.errors[field.name]
                      }
                      helperText={
                        form.touched[field.name] && form.errors[field.name]
                      }
                      id={field.name}
                      variant="outlined"
                      type={this.state.showPassword ? 'text' : 'password'}
                      label="Password"
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
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  );
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Field
                name="visualMode"
                render={({ field, form }) => {
                  return (
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
                  );
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Field
                type="number"
                name="userRequestedPhotoIndexStart"
                render={({ field, form }) => {
                  return (
                    <TextField
                      {...field}
                      error={
                        form.touched[field.name] && form.errors[field.name]
                      }
                      helperText={
                        form.touched[field.name] && form.errors[field.name]
                      }
                      id={field.name}
                      type="number"
                      label="Starting Photo Number"
                      placeholder="1"
                      margin="normal"
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Photo />
                          </InputAdornment>
                        ),
                      }}
                    />
                  );
                }}
              />
            </Grid>

            <Grid item xs={12}>
              {statusInternal === 'complete' ? (
                <h2>Complete!</h2>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={statusInternal === 'running'}
                >
                  {buttonText}
                </Button>
              )}
              {statusInternal === 'running' && (
                <Button
                  type="button"
                  variant="contained"
                  color="secondary"
                  onClick={stopScraper}
                >
                  Stop Scraper
                </Button>
              )}
            </Grid>
          </Grid>
        </Form>
      </Formik>
    );
  }
}

export default withStyles(styles)(ScraperSettings);