/* eslint-disable global-require */
require('dotenv').config();
require('express-async-errors');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const history = require('connect-history-api-fallback');
const { resolve } = require('path');

function configureApiRoutes(app) {
    app.use('/api/organizations/:organizationId/users', require('./routes/users'));
    app.use('/api/organizations/:organizationId/roles', require('./routes/roles'));
    app.use('/api/sessions', require('./routes/sessions'));
    app.use('/api/organizations/:organizationId/agencies', require('./routes/agencies'));
    app.use('/api/organizations/:organizationId/tenants', require('./routes/tenants'));
    app.use('/api/organizations/:organizationId/grants', require('./routes/grants'));
    app.use('/api/organizations/:organizationId/dashboard', require('./routes/dashboard'));
    app.use('/api/organizations/:organizationId/eligibility-codes', require('./routes/eligibilityCodes'));
    app.use('/api/organizations/:organizationId/interested-codes', require('./routes/interestedCodes'));
    app.use('/api/organizations/:organizationId/keywords', require('./routes/keywords'));
    app.use('/api/organizations/:organizationId/refresh', require('./routes/refresh'));
    app.use('/api/annual-reports/', require('./routes/annualReports'));
}

function configureApp(app) {
    app.use(morgan('common'));
    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    configureApiRoutes(app);
    // When ARPA Reporter is brought in, there will be a similar call here to register its routes

    // "public" folder: HTML and JS built by Vue/Webpack, and other static files in client/public
    //  - In dev: these files are served by webpack-dev-server and the requests don't get to here
    //  - In prod: these files are prebuilt and served by this middleware
    const publicPath = resolve(__dirname, '../../client/dist');
    app.use(express.static(publicPath, {
        etag: true,
        lastModified: true,
        setHeaders: (res, path) => {
            const hashRegExp = new RegExp('\\.[0-9a-f]{8}\\.');

            if (path.endsWith('.html')) {
                // All of the project's HTML files end in .html
                res.setHeader('Cache-Control', 'no-cache');
            } else if (hashRegExp.test(path)) {
                // If the RegExp matched, then we have a versioned URL.
                res.setHeader('Cache-Control', 'max-age=31536000');
            }
        },
    }));

    // Any requests that aren't served by previous middlewares (i.e. would 404) get processed as if
    // they were for the root path ("/"). This allows a single-page app (SPA) to manage history/navigation
    // on the clientside without having to use URL hash/fragment (though we're not currently using the
    // relevant option in VueRouter)
    app.use(
        history({
            disableDotRule: true,
            verbose: true,
        }),
    );

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500);
        res.json({ status: 500, message: 'Internal Server Error' });
    });
}

module.exports = { configureApp };
