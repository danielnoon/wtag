# WTag Server
[![CircleCI](https://circleci.com/gh/Supermegadex/wtag.svg?style=svg)](https://circleci.com/gh/Supermegadex/wtag)

So you have a bunch of images sitting in a folder somewhere. Maybe they're on your hard drive, or maybe they're in the cloud. You've decided that it'd be helpful if these images were tagged. Google Photos is a great solution to this issue--upload everything and Google's machine learning models get to work on identifying everything in your personal photos. It's a great service, and millions of people use it; hell, I use it. But what do you do when Google just doesn't cut it? Maybe Google's tags aren't specific enough to be useful, or maybe you're concerned about handing your personal data to the information giant. That's why I've made WTag.

WTag isn't as smart as Google, Microsoft, or Apple's offerings when it comes to photo storage, but that's not the point. It's meant to be used as a self-hosted, shared image-tagging service for personal images. Everything's open source, so you don't have to worry about your data falling into the wrong hands. Should someone want to add machine learning to help with automatic tagging, though, I'd be happy to see a pull request!

## How can I deploy this on my server?
In the future (I always say this), I want to make it easier to deploy, say, by distributing a binary (built with Zeit's pkg, perhaps). Before you start, **you will need a Google Cloud Storage Bucket** in which to store images. Their prices are great, but I want to add other storage providers (i.e. S3, Azure, local) at some point (PRs welcome!). **You will also need a MongoDB instance.**

For now, though, follow these couple of steps:
1. Clone the repository
3. Set some environment variables
   1. `MONGO_URL`: full uri of your MongoDB instance with username and password
   2. `GCP_BUCKET_NAME`: name of your bucket
   3. `JWT_SECRET`: secret to sign your JSON Web Tokens with
   4. `GOOGLE_APPLICATION_CREDENTIALS`: path to JSON file containing GCP authentication information
      * Tip: if you're deploying from a public GitHub repository, *DO NOT* push a json file with the configuration. Make another variable called `GOOGLE_CONFIG` and set it to *the entire contents* of the JSON file. Then set `GOOGLE_APPLICATION_CREDENTIALS` to `./config/gcp.json`.
4. Install the dependencies with `npm i`
5. Build the app with `npm run build`
6. Start the app with `npm start`
