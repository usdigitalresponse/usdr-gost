# GMail Setup

Users log into the app by means of a single-use link that is sent to their email. In order to set your app up to send this email, you'll need to setup an App Password in Gmail.

Visit: <https://myaccount.google.com/apppasswords> and set up an "App Password" (see screenshot below). *Note: Select "Mac" even if you're not using a Mac.*

In `packages/server/.env`, set `NODEMAILER_EMAIL` to your email/gmail and set your `NODEMAILER_EMAIL_PW` to the new generated PW.

![Gmail App Password screen](./img/gmail-app-password.png)

**NOTE:** In order to enable App Password MUST turn on 2FA for gmail.

If running into `Error: Invalid login: 535-5.7.8 Username and Password not accepted.` then ["Allow Less Secure Apps"](https://myaccount.google.com/lesssecureapps) - [source](https://stackoverflow.com/a/59194512)

**NOTE:** Much more reliable and preferable to go the App Password route vs Less Secure Apps.

![Email Error](./img/error-gmail.png)
