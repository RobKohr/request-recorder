## Request Recorder

Request recorder is a tool that gives you a url that you can send web requests to, and it will record the
header, info, the get query, and the body post to a log.

You will then be able to fetch the most recent requests from that log from an accompanying url.

A hosted example is up at:
[http://request-recorder.neverall.com/](http://request-recorder.neverall.com/)

## Usage

```bash
cp default-config.json config.json # you can change the port in config.json
npm install
npm start # this starts it in pm2 so it will run as a background process on your sever
npm run stop # to kill the process
npm run list # see if it is currently running
```
