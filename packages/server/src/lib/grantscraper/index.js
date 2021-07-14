require('dotenv').config();

const db = require('../../db');
const grantsgov = require('../grantsgov');

const { TABLES } = require('../../db/constants');

async function syncGrants(hits) {
    console.log(`found ${hits.length} total results on grants.gov`);
    const rows = hits.map((hit) => ({
        status: 'inbox',
        grant_id: hit.id,
        grant_number: hit.number,
        agency_code: hit.agencyCode,
        award_ceiling: (hit.awardCeiling && parseInt(hit.awardCeiling, 10))
            ? parseInt(hit.awardCeiling, 10) : undefined,
        cost_sharing: hit.costSharing ? 'Yes' : 'No',
        title: hit.title,
        cfda_list: (hit.cfdaList && hit.cfdaList.join(', ')),
        open_date: hit.openDate,
        close_date: hit.closeDate || '2100-01-01',
        notes: 'auto-inserted by script',
        search_terms: `${hit.matchingKeywords.map((kw) => `${kw} [in title/desc]\n`).join('')}${hit.searchKeywords.filter((kw) => hit.matchingKeywords.indexOf(kw) === -1).join('\n')}`,
        reviewer_name: 'none',
        opportunity_category: hit.opportunityCategory,
        description: hit.description,
        eligibility_codes: hit.eligibilityCodes,
        opportunity_status: hit.oppStatus,
        raw_body: hit.rawBody,
    }));
    await db.sync(
        TABLES.grants,
        'grant_id',
        [
            'search_terms',
            'cost_sharing',
            'award_ceiling',
            'close_date',
            'opportunity_category',
            'eligibility_codes',
            'description',
            'opportunity_status',
            'raw_body',
        ],
        rows,
    );
}

async function updateFromGrantsGov(keywords, elCodes) {
    // const existingRows = await db.getGrants();
    const previousHits = [];
    // for (const oppNum in existingRows) {
    //     const id = parseInt(existingRows[oppNum].grant_id, 10);
    //     if (id > 200 || Number.isNaN(id)) {
    //         previousHits.push({
    //             id: existingRows[oppNum].grant_id,
    //             number: oppNum,
    //         });
    //     }
    // }
    // eslint-disable-next-line max-len
    await grantsgov.allOpportunitiesOnlyMatchDescription(previousHits, keywords, elCodes, syncGrants);
    console.log('sync complete!');
}

async function getKeywords() {
    // get global keywords (agencyId === null)
    const rows = await db.getAgencyKeywords(null);
    return rows.map((row) => {
        if (row.mode) {
            return {
                term: row.search_term,
                insertMode: !!row.mode.match(/^autoinsert/),
                insertAll: !!row.mode.match(/ALL/),
            };
        }
        return null;
    }).filter((v) => v);
}

async function getEligibilities() {
    const rows = await db.getElegibilityCodes();
    const enabledCodes = rows.filter((row) => row.enabled).map((row) => row.code);
    return enabledCodes.join('|');
}

let isRunning = false;

async function run() {
    if (process.env.ENABLE_GRANTS_SCRAPER !== 'true') {
        return;
    }
    if (isRunning) {
        return;
    }
    try {
        isRunning = true;
        const res = await grantsgov.getEligibilities();
        const rows = Object.entries(res).map(([key, value]) => ({
            code: key,
            label: value,
        }));
        await db.sync(TABLES.eligibility_codes, 'code', ['label'], rows);
        const elCodes = await getEligibilities();
        if (elCodes === '') {
            console.log('skipping; no elcodes checked');
            return;
        }
        const keywords = await getKeywords();
        await updateFromGrantsGov(keywords, elCodes);
    } catch (err) {
        console.error(err);
    }
    isRunning = false;
}

module.exports = {
    run,
};
