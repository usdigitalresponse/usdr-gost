/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
const got = require('got');
const delay = require('util').promisify(setTimeout);

function simplifyString(string) {
    return string.toLowerCase().replace(/&nbsp;/g, '').replace(/[ \-_.;&"']/g, '');
}

async function enrichHitWithDetails(keywords, hit) {
    console.log(`[grantsgov] pulling description page for ${hit.number}`);
    const resp = await got.post({
        url: 'https://www.grants.gov/grantsws/rest/opportunity/details',
        responseType: 'json',
        form: {
            oppId: hit.id,
        },
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
                console.log(`matches ${kw}`);
                hit.matchingKeywords.push(kw);
            }
        });
        hit.rawBody = JSON.stringify(resp.body);
    } else {
        console.log(`unexpected response: ${resp.body}`);
    }
}

async function search(postBody) {
    const resp = await got.post({
        url: 'https://www.grants.gov/grantsws/rest/opportunities/search/',
        json: postBody,
        responseType: 'json',
    });

    if (resp.statusCode < 200 || resp.statusCode >= 300) {
        console.log('request failed with code', resp.statusCode);
        console.log(resp.body);
        process.exit(1);
    }

    return resp;
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
    resp.body.eligibilities.forEach((item) => {
        res[item.value] = item.label;
    });
    return res;
}

async function allOpportunities0(keyword, eligibilities, startRecordNum) {
    console.log(`searching for ${keyword} @ ${startRecordNum}`);
    const resp = await search({
        startRecordNum,
        keyword,
        eligibilities,
        oppNum: '',
        cfda: '',
        oppStatuses: 'posted|closed|archived',
        sortBy: 'openDate|desc',
    });
    const res = resp.body.oppHits.filter((hit) => !hit.closeDate || hit.closeDate.match(/202[0-9]$/));
    if (startRecordNum + 25 < resp.body.hitCount) {
        const hits = await allOpportunities0(keyword, eligibilities, startRecordNum + 25);
        return res.concat(hits);
    }
    return res;
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

// previous hits is array of [{id, number}]
// all previous hits are always checked for updates to keywords
async function allOpportunitiesOnlyMatchDescription(previousHits, keywords, eligibilities) {
    const insertKeywords = keywords.filter((v) => v.insertMode).map((v) => v.term);
    const insertAllKeywords = keywords.filter((v) => v.insertMode && v.insertAll).map((v) => v.term);
    const allKeywords = keywords.map((v) => v.term);
    const newHits = await allOpportunities(insertKeywords.slice(0), eligibilities);
    const previousHitIds = {};
    previousHits.forEach((hit) => {
        previousHitIds[hit.id] = true;
        if (newHits.filter((v) => v.number === hit.number).length === 0) {
            hit.searchKeywords = ['(none)'];
            newHits.push(hit);
        }
    });
    const finalResults = [];
    for (const i in newHits) {
        let hit = newHits[i];
        try {
            await enrichHitWithDetails(allKeywords.slice(0), hit);
            await delay(700);
        } catch (err) {
            console.log(`attempted to enrich hit but failed with ${err}`);
            hit = null;
        }
        if (hit) {
            const matchingInsertKeywords = hit.matchingKeywords.filter((kw) => insertKeywords.indexOf(kw) >= 0);
            const searchedInsertAllKeywords = hit.searchKeywords.filter((kw) => insertAllKeywords.indexOf(kw) >= 0);
            if (matchingInsertKeywords.length > 0 || searchedInsertAllKeywords.length > 0 || previousHitIds[hit.id]) {
                finalResults.push(hit);
            }
        }
    }
    return finalResults;
}

module.exports = { allOpportunities, allOpportunitiesOnlyMatchDescription, getEligibilities };
