# About this application

## What this tool does

This tool's sole function is to download all of the photos you've been tagged in on Facebook to your computer.  It **doesn't** track you, look at your personal data or your friends' data, save your login info for me or anyone else to use later, or anything else. If you’re someone who knows how to read and understand JavaScript, you can explore the code yourself to verify.  Or ask your friendly neighborhood web/software developer to take a look (buy her/him a coffee, beer, boba tea, or their BEVERAGE_OF_CHOICE as thanks).

To be extra careful, I also recommend using this tool only on your own personal home network and not on a public WiFi network like a coffee shop.

The speed of your computer and WiFi also play a big part in how well this tool performs.  I recommend being on a network with at least 25 Mbps which you can test by going to https://www.speedtest.net/.

## Why this tool exists

Currently, Facebook gives you the ability, with the click of a button, to download full photo albums that you yourself have uploaded to your Facebook account.  However as far as I know, at this moment there's no option on Facebook.com or through their mobile app for you to download all of the photos that you've been tagged in by others.

Reasons why you may want to download your tagged photos:

- You want to print out the photos for a physical photo album and want the best quality version available on Facebook.
- You want a local copy so that you can view offline.
- You're worried a Facebook bug will occur where they lose the photos you're tagged in.
- You're afraid a friend may deactivate or delete their account and you'll no longer have access to the photos they have of you.
- Facebook may (rightly or wrongly) think that you violated one of their terms of service for whatever reason and choose to close your account which means you'll lose access to all the photos you're tagged in.
- Or you, for some reason or other, may choose to close your account.

## Why I decided to build it

I wanted to find a solution to a need that I felt was unaddressed.  In the past, I found different implementations that others built, such as another third party app that connected to Facebook, an [IFTTT](https://ifttt.com/) applet, and a browser extension, but they all had limitations that weren't acceptable to me:

- The IFTTT applet I found only worked for **new** photos you got tagged in, not existing ones.
- The browser extension gave me very low quality versions of my photos (it only downloaded the thumbnail versions, not the full quality ones).
- Both the third party app and browser extension had code that was closed-source so I couldn't see how they worked and confirm that they weren't doing something unscrupulous or nefarious with my account.

The other reason I built this tool was to get my hands dirty and learn some technologies that I've been interested in, specifically Electron.js and Puppeteer.  For a software developer, like any other profession that involves creating things, the best way to learn a new skill is to create something with it, and this project gave me a good opportunity to do that.  So mostly, I built this tool for myself.

## Why I didn't charge for this tool

Like I said, I built this tool mainly for a need I had and for me to learn some new skills along the way.  So it was really built for those purposes, not to make money. But once I had accomplished that, I figured others would find it useful as well so I decided to wrap it up in a nice-looking user interface that non-developers can use too.  And since I wanted as many people as possible to benefit from this tool, by choosing not to profit from it, I don't have to worry about hiding its source code. Having the code out in the open allows anyone to poke and prod at it and see that nothing dishonest is being done with their account data and personal info.

Another reason is because this tool uses all [open-source technologies](https://en.wikipedia.org/wiki/Open-source_software), which means that it was built using technologies that thousands of individuals and company have spent their time and energy contributing to, many of whom did it for free. The spirit of OSS and sharing of knowledge is what makes working in the technology field so great and sets it apart from most other industries. And in that tradition, I'm releasing this code open-source as well. Anyone who wants to build some software using similar technologies can learn from and use my code as a reference.

## Credits

### Technologies used that were built by big companies you may know

- Puppeteer by Google - web scraping technology used to emulate a user navigating to and around a website
- Electron by Github - software to enable using web technologies to build desktop apps
- React.js by Facebook - JavaScript framework responsible for building the user interface
- Material Design by Google - design guide used to make the UI look nice

### Technologies built by everyday software developers, designers, QAs, and many others

- Material-UI
- Formik
- Yup.js
- and many others listed in the *package.json* file

### Design

The icon used for this app was free and downloaded at -  https://www.iconfinder.com/icons/1055042/image_photo_photography_picture_icon.
