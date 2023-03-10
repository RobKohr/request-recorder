const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const filename = 'log.txt';
function json(obj) {
  return JSON.stringify(obj, null, 5);
}
function appendRequest(req) {
  const { headers, method, query, body } = req;
  const data = `
=====
${new Date().toUTCString()}
Method: ${method}
Headers:
${json(headers)}
Query:
${json(query)}
Body:
${json(body)}
    `;

  fs.appendFile(filename, data, function (err) {
    if (err) {
      console.log(`Error writing to file: ${err}`);
    } else {
      console.log(`Data appended to file ${filename} successfully.`);
    }
  });
}
app.get('/', (req, res) => {
  appendRequest(req);
  res.send('Hello World2!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
