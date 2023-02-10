const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const history = require('connect-history-api-fallback');
const morgan = require('morgan');
const { resolve } = require('path');

const agencies = require('./routes/agencies');
const exportsRoute = require('./routes/exports');
const applicationSettings = require('./routes/application_settings');
const subRecipients = require('./routes/subrecipients');
const reportingPeriods = require('./routes/reporting-periods');
const sessions = require('../routes/sessions');
const auditReport = require('./routes/audit-report');
const uploads = require('./routes/uploads');
const users = require('./routes/users');

const environment = require('./environment');

const publicPath = resolve(__dirname, '../../dist');
const staticConf = { maxAge: '1y', etag: false };

function configureApiRoutes(app) {
    app.use('/api/agencies', agencies);
    app.use(
        '/api/application_settings',
        applicationSettings,
    );
    app.use('/api/exports', exportsRoute);
    app.use('/api/subrecipients', subRecipients);
    app.use('/api/reporting_periods', reportingPeriods);
    app.use('/api/sessions', sessions);
    app.use('/api/audit_report', auditReport);
    app.use('/api/uploads', uploads);
    app.use('/api/users', users);
}

function configureApp(app, options = {}) {
    if (!options.disableRequestLogging) {
        app.use(morgan('common'));
    }
    app.use(bodyParser.json());
    app.use(cookieParser(environment.COOKIE_SECRET));

    configureApiRoutes(app);

    if (!environment.IS_DEV) {
        const staticMiddleware = express.static(publicPath, staticConf);
        app.use(staticMiddleware);
        app.use(
            history({
                disableDotRule: true,
                verbose: true,
            }),
        );
        app.use(staticMiddleware);
    }
}

module.exports = { configureApp, configureApiRoutes };

// NOTE: This file was copied from src/server/configure.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
