import React from 'react';
import PropTypes from 'prop-types';
// material-ui
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';

function DisclaimerDialog({ onClose, isVisible }) {
  return (
    <Dialog
      open={isVisible}
      maxWidth="md"
      aria-labelledby="disclaimer-dialog-title"
    >
      <DialogTitle id="disclaimer-dialog-title">Disclaimer</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1">
          This tool requires you to enter your Facebook username and password
          because it needs to be able to log into your account to find your
          tagged photos and download them. You should always be careful about
          giving your account login info to anyone, especially someone you don’t
          know.
          <br />
          <br />I promise I’m not trying to store your account login information
          nor is this tool programmed to gather any information about you while
          it’s logged into your account. But even if you do trust me, I still
          recommend changing your password after you're done using any
          unofficial tool not made by the company that owns the official
          website, preferably to a secure password that you don't use on any
          other site (
          <Typography inline color="primary">
            https://www.wikihow.tech/Create-a-Secure-Password
          </Typography>
          ). Also, start using a password manager like that article mentions. I
          personally use 1Password and would recommend it, but it has gotten a
          bit expensive over the years. Here's a good and free open-source one -{' '}
          <Typography inline color="primary">
            https://buttercup.pw
          </Typography>
          . And here's a podcast episode talking about Buttercup if you want to
          learn more -
          <Typography inline color="primary">
            https://changelog.com/podcast/325.
          </Typography>
          <br />
          <br />
          By the way, this tool isn’t able to handle 2-factor authentication. If
          you have it enabled, you need to temporarily disable it before running
          this tool. Remember to re-enable it afterward. If you’re not currently
          using 2-factor authentication, I highly recommend that you enable it
          for your own security - (
          <Typography inline color="primary">
            https://www.facebook.com/security/2fac/setup/intro/
          </Typography>
          ).
          <br />
          <br />
          There's also a Visual Mode option for you to see how this tool
          navigates inside your account and how it clicks on each photo and
          navigates to the link with the full quality version of your photos.
          The reason this scraper uses the mobile version of Facebook's site is
          that the mobile site has an easy to find link to the full quality
          version. However, using Visual Mode may slow down the speed at which
          this tool runs and there's a higher chance that the tool may crash
          because Visual Mode uses more of your computer's resources.
          <br />
          <br />
          IMPORTANT NOTE: Facebook can easily make changes to their website that
          will break the functionality of this tool so if that happens and this
          tool isn't working for you, please send an email to the address you'll
          find on the next screen. Hopefully I'll be able find a workaround to
          fix it but no guarantees.
          <br />
          <br />
          By using this tool, you agree that you're using it at your own risk
          and won't hold the developer liable for any issues that may occur as a
          result of using it. As far as I know, there aren’t any privacy or
          security flaws/vulnerabilities with this tool. And I definitely didn’t
          intentionally add any myself. I’m not a security expert so I won’t
          make any guarantees. If you're a software security expert, please let
          me know if you see any issues that need to be addressed.
          <br />
          <br />
          With that said, I used this tool on my own account to download my
          photos so if there were any issues, I’ve exposed myself to them as
          well.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          I accept
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DisclaimerDialog.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DisclaimerDialog;
