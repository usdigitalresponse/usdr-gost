/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
const got = require('got');
const delay = require('util').promisify(setTimeout);

const BatchProcessor = require('./batchProcessor');

const REQUEST_DELAY = process.env.GRANTS_SCRAPER_DELAY || 500;
const HTTP_TIMEOUT = parseInt(process.env.GRANTS_SCRAPER_HTTP_TIMEOUT, 10) || 20000;

function simplifyString(string) {
    return string.toLowerCase().replace(/&nbsp;/g, '').replace(/[ \-_.;&"']/g, '');
}

async function enrichHitWithDetails(keywords, hit) {
    // console.log(`[grantsgov] pulling description page for ${hit.number}`);
    const resp = await got.post({
        url: 'https://www.grants.gov/grantsws/rest/opportunity/details',
        responseType: 'json',
        form: {
            oppId: hit.id,
        },
        timeout: HTTP_TIMEOUT,
    });

    hit.matchingKeywords = [];
    if ((resp.body.synopsis || resp.body.forecast) && resp.body.opportunityTitle) {
        let desc = null;
        if (resp.body.synopsis) {
            desc = resp.body.synopsis.synopsisDesc;
            hit.description = desc;
            hit.awardCeiling = resp.body.synopsis.awardCeiling;
            hit.costSharing = resp.body.synopsis.costSharing;
            if (resp.body.synopsis.applicantTypes) {
                hit.eligibilityCodes = resp.body.synopsis.applicantTypes.map((appl) => appl.id).join(' ');
            }
        } else {
            desc = resp.body.forecast.forecastDesc;
            hit.awardCeiling = resp.body.forecast.awardCeiling;
            hit.costSharing = resp.body.forecast.costSharing;
        }
        if (resp.body.opportunityCategory) {
            hit.opportunityCategory = resp.body.opportunityCategory.description;
        }
        keywords.forEach((kw) => {
            if (
                simplifyString(desc).includes(simplifyString(kw))
        || simplifyString(resp.body.opportunityTitle).includes(simplifyString(kw))
            ) {
                // console.log(`matches ${kw}`);
                hit.matchingKeywords.push(kw);
            }
        });
        hit.rawBody = JSON.stringify(resp.body);
    } else {
        console.log(`unexpected response: ${resp.body}`);
    }
}

async function search(postBody) {
    try {
        const resp = await got.post({
            url: 'https://www.grants.gov/grantsws/rest/opportunities/search/',
            json: postBody,
            responseType: 'json',
            timeout: HTTP_TIMEOUT,
        });

        if (resp.statusCode < 200 || resp.statusCode >= 300) {
            console.log('request failed with code', resp.statusCode);
            console.log(resp.body);
        }
        return resp;
    } catch (err) {
        console.log('request failed', err);
        return null;
    }
}

async function getEligibilities() {
    const resp = await search({
        startRecordNum: 0,
        keyword: '',
        oppNum: '',
        cfda: '',
        // oppStatuses: 'posted',
        oppStatuses: 'posted|closed|archived',
        sortBy: 'openDate|desc',
    });
    const res = {};
    if (resp) {
        resp.body.eligibilities.forEach((item) => {
            res[item.value] = item.label;
        });
    }
    return res;
}

async function allOpportunities0({ keyword, eligibilities }, pageSize, offset) {
    console.log(`searching for ${keyword} @ ${offset}`);
    const resp = await search({
        startRecordNum: offset,
        keyword,
        dateRange: process.env.GRANTS_SCRAPER_DATE_RANGE || 56,
        eligibilities,
        oppNum: '',
        cfda: '',
        oppStatuses: 'posted|forecasted',
        sortBy: 'openDate|desc',
    });
    if (resp && resp.body && resp.body.oppHits) {
        const hits = resp.body.oppHits.filter((hit) => !hit.closeDate || hit.closeDate.match(/202[0-9]$/));
        return hits;
    }
    return [];
}

async function allOpportunities(keywords, eligibilities) {
    const results = {};
    for (const i in keywords) {
        const thisKeyword = keywords[i];
        const hits = await allOpportunities0(thisKeyword, eligibilities, 0);
        hits.forEach((hit) => {
            if (!results[hit.number]) {
                results[hit.number] = hit;
                results[hit.number].searchKeywords = [];
            }
            results[hit.number].searchKeywords.push(thisKeyword);
        });
    }
    return Object.values(results);
}

async function processGrants({
    keyword, insertKeywords, insertAllKeywords, allKeywords, syncFn,
}, grants) {
    const grantsToSynch = [];
    // eslint-disable-next-line no-restricted-syntax
    for (let grant of grants) {
        try {
            await delay(REQUEST_DELAY);
            await enrichHitWithDetails(allKeywords.slice(0), grant);
            grant.searchKeywords = [keyword];
        } catch (err) {
            console.log(`attempted to enrich grant but failed with ${err}`);
            grant = null;
        }
        if (grant) {
            // eslint-disable-next-line max-len
            const matchingInsertKeywords = grant.matchingKeywords.filter((kw) => insertKeywords.indexOf(kw) >= 0);
            // eslint-disable-next-line max-len
            const searchedInsertAllKeywords = grant.searchKeywords.filter((kw) => insertAllKeywords.indexOf(kw) >= 0);
            if (matchingInsertKeywords.length > 0 || searchedInsertAllKeywords.length > 0) {
                grantsToSynch.push(grant);
            }
        }
    }
    await syncFn(grantsToSynch);
    const used = process.memoryUsage();
    for (const key in used) {
        // eslint-disable-next-line no-mixed-operators
        console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
}

async function synchGrants(insertKeywords, insertAllKeywords, allKeywords, eligibilities, syncFn) {
    const batchProcessors = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const keyword of allKeywords) {
        const batchProcessor = new BatchProcessor({
            pageSize: 10,
            offset: 0,
            runOnce: true,
            sleepMs: REQUEST_DELAY,
            fetchRecordsFn: allOpportunities0,
            processRecordsFn: processGrants,
            context: {
                keyword,
                eligibilities,
                insertKeywords,
                insertAllKeywords,
                allKeywords,
                syncFn,
            },
        });
        batchProcessors.push(batchProcessor.start());
    }
    return Promise.all(batchProcessors);
}

// previous hits is array of [{id, number}]
// all previous hits are always checked for updates to keywords
async function allOpportunitiesOnlyMatchDescription(previousHits, keywords, eligibilities, syncFn) {
    const insertKeywords = keywords.filter((v) => v.insertMode).map((v) => v.term);
    // eslint-disable-next-line max-len
    const insertAllKeywords = keywords.filter((v) => v.insertMode && v.insertAll).map((v) => v.term);
    const allKeywords = keywords.map((v) => v.term);
    await synchGrants(insertKeywords, insertAllKeywords, allKeywords, eligibilities, syncFn);
}

module.exports = { allOpportunities, allOpportunitiesOnlyMatchDescription, getEligibilities };
