import express from 'express';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import SQL from 'sql-template-strings';

const app = express();
app.use(express.static('public'));
const port = 80;
const db = await open({
  filename: 'db/database.db',
  driver: sqlite3.Database
});

await db.exec(
  `create table if not exists request (id integer primary key, channel text, method text, headers text, query text, body text, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`
);
await db.exec(`CREATE INDEX if not exists request_channel ON request(channel)`);
await db.exec(
  `CREATE INDEX if not exists request_timestamp ON request(timestamp)`
);

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

function prependToFile(str, filepath) {
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    const newData = str + data;
    fs.writeFileSync(filepath, newData);
    console.log(`"${str}" was successfully prepended to ${filepath}.`);
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}
app.get('/', (req, res) => {});

const channelResponder = (req, res) => {
  console.log(req.baseUrl);
  saveRequest(req, req.params.channel);
  res.send('get success' + req.params.channel);
};

app.get('/');
app.get('/channel/:channel', channelResponder);
app.post('/channel/:channel', channelResponder);
app.get('/log/:channel', async (req, res) => {
  const result = await db.all(
    'SELECT * FROM request WHERE channel = ? order by timestamp desc',
    req.params.channel
  );
  const logElementRow = (key, val) => {
    return `
    <div class="log-element-row">
        <div class="log-element-cell log-element-key">
            ${key}
        </div>
        <pre class="log-element-cell log-element-val">
${val}
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
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
