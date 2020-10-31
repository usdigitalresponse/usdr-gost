/* eslint-disable global-require */
require('dotenv').config();
const bodyParser = require('body-parser');
const morgan = require('morgan');

module.exports = (app) => {
    app.use(morgan('common'));
    app.use(bodyParser.json());
    app.use('/api/grants', require('./routes/grants'));
};
