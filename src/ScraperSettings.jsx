import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';

const initialValues = {
  username: '',
  password: '',
  userRequestedPhotoIndexStart: '',
  visualMode: false,
};
const settingsSchema = yup.object().shape({
  username: yup.string().required(),
  password: yup.string().required(),
  userRequestedPhotoIndexStart: yup
    .number()
    .positive()
    .integer(),
  visualMode: yup.bool(),
});

const ScraperSettings = ({ statusInternal, startScraper, stopScraper }) => {
  const buttonText =
    statusInternal === 'crashed' || statusInternal === 'failed'
      ? 'Retry'
      : 'Start';
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={settingsSchema}
      onSubmit={values => {
        const { userRequestedPhotoIndexStart, visualMode } = values;
        startScraper(userRequestedPhotoIndexStart, visualMode);
      }}
    >
      {() => (
        <Form>
          <label htmlFor="username">Username/Email</label>
          <Field type="text" name="username" />
          <ErrorMessage name="username" component="div" />
          <br />

          <label htmlFor="password">Password</label>
          <Field type="password" name="password" />
          <ErrorMessage name="password" component="div" />
          <br />

          <label htmlFor="visualMode">Enable Visual Mode?</label>
          <Field name="visualMode" type="checkbox" />
          <br />

          <label htmlFor="userRequestedPhotoIndexStart">
            If you want to start at a certain photo number, enter it here:
          </label>
          <Field type="number" name="userRequestedPhotoIndexStart" />
          <ErrorMessage name="userRequestedPhotoIndexStart" component="div" />
          <br />

          {statusInternal === 'complete' ? (
            <h2>Complete!</h2>
          ) : (
            <button type="submit" disabled={statusInternal === 'running'}>
              {buttonText}
            </button>
          )}
          {statusInternal === 'running' && (
            <button type="button" onClick={stopScraper}>
              Stop Scraper
            </button>
          )}
        </Form>
      )}
    </Formik>
  );
};
ScraperSettings.propTypes = {
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

export default ScraperSettings;
