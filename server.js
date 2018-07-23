const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'dist')));
//app.get('/', (req, res) => res.send('Hello World!'))

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Example app listening on port ${port}`));