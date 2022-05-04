const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Hello Geekhunter!'));

const server = app.listen(process.env.PORT || 52353, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);
});