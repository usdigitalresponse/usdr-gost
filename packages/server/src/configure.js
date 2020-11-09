/* eslint-disable global-require */
require('dotenv').config();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

module.exports = (app) => {
    app.use(cors());
    app.use(morgan('common'));
    app.use(bodyParser.json());
    app.use('/api/grants', require('./routes/grants'));
    app.use('/api/eligibility-codes', require('./routes/eligibilityCodes'));
    app.use('/api/keywords', require('./routes/keywords'));
    app.use('/api/refresh', require('./routes/refresh'));
};
