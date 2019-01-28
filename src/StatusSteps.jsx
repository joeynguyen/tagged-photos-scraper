import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import SuccessfulDownloadDialog from './SuccessfulDownloadDialog';

function getSteps() {
  return [
    'Ready',
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
  state = {
    currentStep: this.props.status.statusCode,
    currentMessage: this.props.status.message,
    successDialogVisible: false,
  };

  static getDerivedStateFromProps(props) {
    // if the statusCode is not 98 (crashed) or 99 (failed),
    // update the current step
    const { statusCode } = props.status;
    const hasError = statusCode === 98 || statusCode === 99;

    if (!hasError) {
      return {
        currentStep: props.status.statusCode,
        currentMessage: props.status.message,
      };
    }
    return null;
  }

  static propTypes = {
    status: PropTypes.shape({
      statusCode: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
    }).isRequired,
    photosDownloaded: PropTypes.number.isRequired,
    photosFound: PropTypes.number.isRequired,
  };

  showSuccessDialog = () => {
    this.setState({ successDialogVisible: true });
  };

  hideSuccessDialog = () => {
    this.setState({ successDialogVisible: false });
  };

  componentDidUpdate(prevProps) {
    const {
      status: { statusCode },
    } = this.props;
    if (statusCode === 100 && statusCode !== prevProps.status.statusCode) {
      this.showSuccessDialog();
    }
  }

  render() {
    const steps = getSteps();
    const { currentStep, currentMessage } = this.state;
    const {
      photosDownloaded,
      photosFound,
      status: { message, statusCode },
    } = this.props;
    const hasError = statusCode === 98 || statusCode === 99;
    const isSuccessful = statusCode === 100;
    let additionalInfo = currentMessage;
    if (currentStep === 7) {
      additionalInfo = `${currentMessage} ${photosFound} photos found so far.`;
    }
    if (currentStep === 8) {
      additionalInfo = `${photosFound} photos found total.`;
    }
    if (currentStep === 9) {
      additionalInfo = `${currentMessage} Downloaded photo ${photosDownloaded} of ${photosFound} photos found.`;
    }

    return (
      <div style={{ width: '90%' }}>
        <SuccessfulDownloadDialog
          onClose={this.hideSuccessDialog}
          successDialogVisible={this.state.successDialogVisible}
        />
        <Stepper activeStep={currentStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel error={index === currentStep && hasError}>
                {label}
              </StepLabel>
              <StepContent>
                <Typography color={hasError ? 'error' : 'default'}>
                  {additionalInfo}
                </Typography>
                {hasError && <Typography color="error">{message}</Typography>}
              </StepContent>
            </Step>
          ))}
        </Stepper>
        {isSuccessful && (
          <Paper square elevation={0}>
            <Typography>{message}</Typography>
          </Paper>
        )}
      </div>
    );
  }
}
