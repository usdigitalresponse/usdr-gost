const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const history = require('connect-history-api-fallback');
const morgan = require('morgan');
const { resolve } = require('path');

const environment = require('./environment');
const agenciesRoutes = require('./routes/agencies');
const applicationSettingsRoutes = require('./routes/application_settings');
const exportsRoutes = require('./routes/exports');
const subrecipientsRoutes = require('./routes/subrecipients');
const reportingPeriodsRoutes = require('./routes/reporting-periods');
const sessionsRoutes = require('../routes/sessions');
const auditReportRoutes = require('./routes/audit-report');
const uploadsRoutes = require('./routes/uploads');
const usersRoutes = require('./routes/users');

const publicPath = resolve(__dirname, '../../dist');
const staticConf = { maxAge: '1y', etag: false };

function configureApiRoutes(app) {
    app.use('/api/agencies', agenciesRoutes);
    app.use('/api/application_settings', applicationSettingsRoutes);
    app.use('/api/exports', exportsRoutes);
    app.use('/api/subrecipients', subrecipientsRoutes);
    app.use('/api/reporting_periods', reportingPeriodsRoutes);
    app.use('/api/sessions', sessionsRoutes);
    app.use('/api/audit_report', auditReportRoutes);
    app.use('/api/uploads', uploadsRoutes);
    app.use('/api/users', usersRoutes);
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
