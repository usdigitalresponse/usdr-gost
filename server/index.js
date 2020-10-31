const express = require('express');
const configureAPI = require('./configure');

const { PORT = 3000 } = process.env;
const app = express();
configureAPI(app);

app.listen(PORT, () => console.log(`App running on port ${PORT}!`));
