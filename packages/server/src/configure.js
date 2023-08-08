/* eslint-disable global-require */
require('dotenv').config();
require('express-async-errors');
const { v4 } = require('uuid');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const history = require('connect-history-api-fallback');
const { resolve } = require('path');
const { configureApiRoutes: configureArpaReporterApiRoutes } = require('./arpa_reporter/configure');
const { requestProviderMiddleware } = require('./arpa_reporter/use-request');

function generateV4UUID() {
    return v4();
}

const ATTRIBUTE_NAME = 'id';

/*
 * Function to add a unique request ID to all requests
 */
function requestID({
    generator = generateV4UUID,
    headerName = 'X-Request-Id',
    setHeader = true,
} = {}) {
    return function (request, response, next) {
        const oldValue = request.get(headerName);
        const id = oldValue === undefined ? generator(request) : oldValue;

        if (setHeader) {
            response.set(headerName, id);
        }

        request[ATTRIBUTE_NAME] = id;

        next();
    };
}

function configureApiRoutes(app) {
    app.use('/api/organizations/:organizationId/users', require('./routes/users'));
    app.use('/api/organizations/:organizationId/roles', require('./routes/roles'));
    app.use('/api/sessions', require('./routes/sessions'));
    app.use('/api/organizations/:organizationId/agencies', require('./routes/agencies'));
    app.use('/api/organizations/:organizationId/tenants', require('./routes/tenants'));
    app.use('/api/organizations/:organizationId/grants', require('./routes/grants'));
    app.use('/api/organizations/:organizationId/grants-saved-search', require('./routes/grantsSavedSearch'));
    app.use('/api/organizations/:organizationId/dashboard', require('./routes/dashboard'));
    app.use('/api/organizations/:organizationId/eligibility-codes', require('./routes/eligibilityCodes'));
    app.use('/api/organizations/:organizationId/interested-codes', require('./routes/interestedCodes'));
    app.use('/api/organizations/:organizationId/keywords', require('./routes/keywords'));
    app.use('/api/organizations/:organizationId/refresh', require('./routes/refresh'));
    app.use('/api/annual-reports/', require('./routes/annualReports'));
    app.use('/api/health', require('./routes/health'));
}

function configureApp(app, options = {}) {
    app.use(morgan('common', {
        skip: (req) => {
            // Render hits the health check path extremely often, so don't clutter logs with it.
            if (req.originalUrl === '/api/health') {
                return true;
            }

            // We disable request logging during API tests because it makes the Mocha test output noisy
            if (options.disableRequestLogging) {
                return true;
            }

            return false;
        },
    }));
    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(requestProviderMiddleware);
    app.use(requestID());

    configureApiRoutes(app);
    configureArpaReporterApiRoutes(app);

    // "public" folder: HTML and JS built by Vue/Webpack, and other static files in client/public
    //  - In dev: these files are served by webpack-dev-server and the requests don't get to here
    //  - In prod: these files are prebuilt and served by this middleware
    const publicPath = resolve(__dirname, '../../client/dist');
    const staticMiddleware = express.static(publicPath, {
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
    });
    app.use(staticMiddleware);

    // Any requests that aren't served by previous middlewares (i.e. would 404) get processed as if
    // they were for the root path ("/"). This allows a single-page app (SPA) to manage history/navigation
    // on the clientside without having to use URL hash/fragment (though we're not currently using the
    // relevant option in VueRouter)
    app.use(
        history({
            disableDotRule: true,
            verbose: true,
            rewrites: [
                {
                    from: /^\/arpa_reporter\/.*/,
                    to: '/arpa_reporter/index.html',
                },
            ],
        }),
        // Not a mistake that we call this twice! Since the history middleware rewrites to paths that
        // are handled by the static middleware above it, we need the static middleware to run a second
        // time after the history middleware rewrote the URL.
        staticMiddleware,
    );
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500);
        res.json({ status: 500, message: 'Internal Server Error' });
    });
}

module.exports = { configureApp };
