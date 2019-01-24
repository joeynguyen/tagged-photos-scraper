import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Button, CheckBox, FormField, Text, TextInput } from 'grommet';

import * as yup from 'yup';

const initialValues = {
  email: '',
  password: '',
  userRequestedPhotoIndexStart: '',
  visualMode: false,
};
const settingsSchema = yup.object().shape({
  email: yup
    .string()
    .email()
    .required(),
  password: yup.string().required(),
  userRequestedPhotoIndexStart: yup
    .number('must be a number')
    .positive('must be a positive number')
    .integer('must be an integer'),
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
        const {
          email,
          password,
          userRequestedPhotoIndexStart,
          visualMode,
        } = values;
        startScraper(email, password, userRequestedPhotoIndexStart, visualMode);
      }}
    >
      {() => (
        <Form>
          <Field
            type="text"
            name="email"
            render={({ field, form }) => {
              return (
                <FormField
                  error={form.touched[field.name] && form.errors[field.name]}
                  htmlFor={field.name}
                  label={field.name}
                >
                  <TextInput
                    {...field}
                    id={field.name}
                    placeholder="username@website.com"
                  />
                </FormField>
              );
            }}
          />

          <Field
            name="password"
            render={({ field, form }) => {
              return (
                <FormField
                  error={form.touched[field.name] && form.errors[field.name]}
                  htmlFor={field.name}
                  label={field.name}
                >
                  <TextInput {...field} id={field.name} type="password" />
                </FormField>
              );
            }}
          />

          <Field
            name="visualMode"
            render={({ field, form }) => {
              return (
                <FormField
                  error={form.touched[field.name] && form.errors[field.name]}
                  htmlFor={field.name}
                  label="Visual Mode"
                >
                  <CheckBox {...field} id={field.name} label="Enable" toggle />
                </FormField>
              );
            }}
          />

          <Field
            type="number"
            name="userRequestedPhotoIndexStart"
            render={({ field, form }) => {
              return (
                <FormField
                  error={form.touched[field.name] && form.errors[field.name]}
                  htmlFor={field.name}
                  label="Starting Photo Number (optional - starts with the first photo by default)"
                >
                  <TextInput
                    {...field}
                    id={field.name}
                    type="number"
                    placeholder="1"
                  />
                </FormField>
              );
            }}
          />

          {statusInternal === 'complete' ? (
            <Text size="xlarge">Complete!</Text>
          ) : (
            <Button
              type="submit"
              primary
              disabled={statusInternal === 'running'}
              label={buttonText}
            />
          )}
          {statusInternal === 'running' && (
            <Button type="button" onClick={stopScraper} label="Stop Scraper" />
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
