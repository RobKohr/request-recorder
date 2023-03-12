import express from 'express';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import SQL from 'sql-template-strings';
import defaultConfig from './default-config.json' assert { type: 'json' };
import configOverrides from './config.json' assert { type: 'json' };
import https from 'https';
import bodyParser from 'body-parser';
import { encode } from 'html-entities';
const config = { ...defaultConfig, ...configOverrides };

//setup express app
const app = express();
app.use(express.static('public'));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

//setup db
const db = await open({
  filename: 'database.db',
  driver: sqlite3.Database
});
await db.exec(
  `create table if not exists request (id integer primary key, channel text, method text, headers text, query text, body text, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`
);
await db.exec(`CREATE INDEX if not exists request_channel ON request(channel)`);
await db.exec(
  `CREATE INDEX if not exists request_timestamp ON request(timestamp)`
);

//helper functions
function json(obj) {
  return JSON.stringify(obj, null, 5);
}
function saveRequest(req, channel) {
  const { method } = req;
  const headers = json(req.headers);
  const query = json(req.query);
  const body = json(req.body);
  db.run(
    SQL`Insert into request (channel, method, headers, query, body ) values (${channel}, ${method}, ${headers}, ${query}, ${body} ) `
  );
}

let requestTimestamps = [];
const limitPerMinute = 60;
function rateLimiter(req, res, next) {
  const now = Math.round(new Date().getTime() / 1000);
  const oneMinAgo = now - 60;
  if (requestTimestamps.length >= limitPerMinute) {
    // get rid of old timestamps
    requestTimestamps = requestTimestamps.filter((ts) => ts > oneMinAgo);
  }
  if (requestTimestamps.length >= limitPerMinute) {
    return res
      .status(503)
      .send(`Service only accepts at most ${limitPerMinute} requests a minute`);
  }
  requestTimestamps.push(now);
  return next();
}

//respond to post and get messages
const channelReceiver = (req, res) => {
  console.log(req.baseUrl);
  saveRequest(req, req.params.channel);
  res.send('success ' + req.params.channel);
};
app.all('/channel/:channel', rateLimiter, channelReceiver);
app.get('/log/:channel', async (req, res) => {
  const result = await db.all(
    'SELECT * FROM request WHERE channel = ? order by timestamp desc limit 1000',
    req.params.channel
  );
  const logElementRow = (key, val) => {
    return `
    <div class="log-element-row">
        <div class="log-element-cell log-element-key">
            ${key}
        </div>
        <pre class="log-element-cell log-element-val">
${encode(val)}
        </pre>
    </div>
    `;
  };
  let logContent = '';
  for (const row of result) {
    logContent += `
        <div class="log-element">
            ${logElementRow('timestamp', row.timestamp)}
            ${logElementRow('method', row.method)}
            ${logElementRow('headers', row.headers)}
            ${logElementRow('query', row.query)}
            ${logElementRow('body', row.body)}
        </div>    
    `;
  }

  res.send(
    `
<html>
<link rel="stylesheet" type="text/css" href="../main.css" />
<body>
    <div id="head">
        <a href="/"><img src="../Rob-burrito_a_reel_to_reel_old_style_recorder_on_the_moon_conne_786624a8-c494-46eb-891a-928b026461c7.png"
            style="float:left"></a>
        <div>
            <h1>
                <a href="/">Request Recorder</a>
            </h1>
        </div>
    </div>
    <div id="content">
    <h2>Log for ${req.params.channel}</h2>
    ${logContent}
    </div>
</html>
`
  );
});
app.listen(config.port, () => {
  console.log(`Example app listening on port ${config.port}`);
});

let key = '';
let cert = '';
if (config.certLocation) {
  cert = fs.readFileSync(config.certLocation);
  key = fs.readFileSync(config.keyLocation);
}

if (key) {
  https.createServer({ key, cert }, app).listen(443);
} else {
  console.log('no ssl key and cert set in config.json');
}
