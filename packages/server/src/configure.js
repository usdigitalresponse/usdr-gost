/* eslint-disable global-require */
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const history = require('connect-history-api-fallback');
const { resolve } = require('path');

const publicPath = resolve(__dirname, '../../client/dist');
const staticConf = { maxAge: '1y', etag: false };

module.exports = (app) => {
    app.use(cors({
        credentials: true,
        exposedHeaders: ['set-cookie'],
        origin: (origin, callback) => {
            // if (allowedOrigins.includes(origin)) {
            callback(null, true);
            // } else {
            //     callback(new Error(`Origin: ${origin} is now allowed`));
            // }
        },
    }));
    app.use(morgan('common'));
    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.use(bodyParser.json());
    app.use('/api/users', require('./routes/users'));
    app.use('/api/sessions', require('./routes/sessions'));
    app.use('/api/agencies', require('./routes/agencies'));
    app.use('/api/grants', require('./routes/grants'));
    app.use('/api/eligibility-codes', require('./routes/eligibilityCodes'));
    app.use('/api/keywords', require('./routes/keywords'));
    app.use('/api/refresh', require('./routes/refresh'));

    const staticMiddleware = express.static(publicPath, staticConf);
    app.use(staticMiddleware);
    app.use(
        history({
            disableDotRule: true,
            verbose: true,
        }),
    );
};
