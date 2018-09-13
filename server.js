const path = require('path');
const express = require('express');
const app = express();

app.use(express.static(__dirname));

app.listen(3001, () => console.log('app is running at port 3001!'));
