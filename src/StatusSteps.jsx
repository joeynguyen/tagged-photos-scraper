import React from 'react';
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

// function getStepContent(step) {
//   switch (step) {
//     case 0:
//       return `For each ad campaign that you create, you can control how much
//               you're willing to spend on clicks and conversions, which networks
//               and geographical locations you want your ads to show on, and more.`;
//     case 1:
//       return 'An ad group contains one or more ads which target a shared set of keywords.';
//     case 2:
//       return `Try out different ad text to see what brings in the most customers,
//               and learn how to enhance your ads using features like ad extensions.
//               If you run into any problems with your ads, find out how to tell if
//               they're running and how to resolve approval issues.`;
//     default:
//       return 'Unknown step';
//   }
// }

function StatusSteps({
  logFileLocation,
  photosDownloadedCount,
  photosTotal,
  status,
}) {
  const { message, statusCode } = status;
  const steps = getSteps();

  return (
    <div style={{ width: '90%' }}>
      <Stepper activeStep={statusCode} orientation="vertical">
        {steps.map((label, index) => (
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

StatusSteps.propTypes = {
  status: PropTypes.shape({
    statusCode: PropTypes.number.isRequired,
    message: PropTypes.string.isRequired,
  }).isRequired,
};

export default StatusSteps;
