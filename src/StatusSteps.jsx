import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Typography from '@material-ui/core/Typography';

function getSteps() {
  return [
    'Ready to begin',
    'Starting up the scraping engine',
    'Going to facebook.com',
    'Logging into your account',
    'Going to your profile page',
    'Going to the "Photos" page',
    'Searching for photos',
    'Scrolling down the page to load more photos',
    'Found all of your tagged photos',
    'Downloading photos...',
  ];
}

export default class StatusSteps extends Component {
  static propTypes = {
    status: PropTypes.shape({
      statusCode: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
    }).isRequired,
    photosDownloaded: PropTypes.number.isRequired,
    photosFound: PropTypes.func.isRequired,
  };

  render() {
    const { message, statusCode } = this.props.status;
    const steps = getSteps();

    return (
      <div style={{ width: '90%' }}>
        <Stepper activeStep={statusCode} orientation="vertical">
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                <Typography>{message}</Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        {/* {activeStep === steps.length && (
          <Paper square elevation={0} className={classes.resetContainer}>
            <Typography>All steps completed - you&apos;re finished</Typography>
            <Button onClick={this.handleReset} className={classes.button}>
              Reset
            </Button>
          </Paper>
        )} */}
      </div>
    );
  }
}
