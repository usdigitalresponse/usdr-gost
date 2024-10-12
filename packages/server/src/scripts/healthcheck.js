// Usage: node healthcheck.js [url] [timeout]
// Exits with error (status code 1) when HTTP request errors or responds with non-200 status.
const got = require('got');

const url = process.argv[2] || 'http://localhost:3000/api/health';
const timeout = Number.parseInt(process.argv[3], 10) || 5000;

console.log(url);

got(url, { timeout }).then((res) => {
    const { statusCode } = res;
    console.log(res.statusCode);
    if (statusCode !== 200) {
        process.exit(1);
    }
    process.exit(0);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
