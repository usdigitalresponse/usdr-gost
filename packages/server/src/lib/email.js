const { URL } = require('url');
const moment = require('moment');
// eslint-disable-next-line import/no-unresolved
const asyncBatch = require('async-batch').default;
const fileSystem = require('fs');
const path = require('path');
const mustache = require('mustache');
const emailService = require('./email/service-email');
const db = require('../db');
const { notificationType } = require('./email/constants');

const expiryMinutes = 30;
const ASYNC_REPORT_TYPES = {
    audit: 'audit',
    treasury: 'treasury',
};

async function deliverEmail({
    toAddress,
    emailHTML,
    emailPlain,
    subject,
}) {
    return emailService.getTransport().sendEmail({
        toAddress,
        subject,
        body: emailHTML,
        text: emailPlain,
    });
}

function addBaseBranding(emailHTML, brandDetails) {
    const { tool_name, title, notifications_url } = brandDetails;
    const baseBrandedTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/base.html'));
    const brandedHTML = mustache.render(baseBrandedTemplate.toString(), {
        tool_name,
        title,
        webview_available: false, // Preheader and webview are not setup for Grant notification email.
        // preheader: 'Test preheader',
        // webview_url: 'http://localhost:8080',
        usdr_url: 'http://usdigitalresponse.org',
        usdr_logo_url: 'https://grants.usdigitalresponse.org/usdr_logo_transparent.png',
        notifications_url,
    }, {
        email_body: emailHTML,
    });

    return brandedHTML;
}

function sendPassCode(email, passcode, httpOrigin, redirectTo) {
    if (!httpOrigin) {
        throw new Error('must specify httpOrigin in sendPassCode');
    }

    const url = new URL(`${httpOrigin}/api/sessions`);
    url.searchParams.set('passcode', passcode);
    if (redirectTo) {
        url.searchParams.set('redirect_to', redirectTo);
    }
    const href = url.toString();

    const formattedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_formatted_body.html'));

    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: 'Login Passcode',
        body_detail: `<p>Your link to access USDR's Grants Tool is <a href=${href}>${href}</a>.
        It expires in ${expiryMinutes} minutes</p>`,
    });

    const emailHTML = module.exports.addBaseBranding(
        formattedBody,
        {
            tool_name: href.includes('reporter') ? 'Grants Reporter Tool' : 'Grants Identification Tool',
            title: 'Login Passcode',
        },
    );

    if (process.env.DEV_LOGIN_LINK && process.env.NODE_ENV === 'development') {
        console.log(`Login link generated: \x1b[32m${href}`);
    }
    return module.exports.deliverEmail({
        toAddress: email,
        emailHTML,
        emailPlain: `Your link to access USDR's Grants tool is ${href}. It expires in ${expiryMinutes} minutes`,
        subject: 'USDR Grants Tool Access Link',
    });
}

function sendWelcomeEmail(email, httpOrigin) {
    if (!httpOrigin) {
        throw new Error('must specify httpOrigin in sendWelcomeEmail');
    }
    const formattedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_formatted_body.html'));

    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: 'Welcome!',
        body_detail: `<p>Visit USDR's Grants Tool at:
        <a href="${httpOrigin}">${httpOrigin}</a>.`,
    });

    const emailHTML = module.exports.addBaseBranding(
        formattedBody,
        {
            tool_name: httpOrigin.includes('reporter') ? 'Grants Reporter Tool' : 'Grants Identification Tool',
            title: 'Welcome to the USDR Grants tool',
        },
    );

    return module.exports.deliverEmail({
        toAddress: email,
        emailHTML,
        emailPlain: `Visit USDR's Grants Tool at: ${httpOrigin}.`,
        subject: 'Welcome to USDR Grants Tool',
    });
}

function getGrantDetail(grant, emailNotificationType) {
    const grantDetailTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_grant_detail.html'));
    const grantDetail = mustache.render(
        grantDetailTemplate.toString(), {
            title: grant.title,
            description: grant.description && grant.description.length > 400 ? `${grant.description.substring(0, 400)}...` : grant.description,
            status: grant.opportunity_status,
            show_date_range: grant.open_date && grant.close_date,
            open_date: grant.open_date ? new Date(grant.open_date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : undefined,
            close_date: grant.close_date ? new Date(grant.close_date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : undefined,
            award_floor: grant.award_floor || '$0',
            award_ceiling: grant.award_ceiling || 'Not available',
            // estimated_funding: grant.estimated_funding, TODO: add once field is available in the database.
            cost_sharing: grant.cost_sharing,
            link_url: `https://www.grants.gov/web/grants/view-opportunity.html?oppId=${grant.grant_id}`,
            grants_url: `${process.env.WEBSITE_DOMAIN}/#/${emailNotificationType === notificationType.grantDigest ? 'grants' : 'my-grants'}`,
            view_grant_label: emailNotificationType === notificationType.grantDigest ? undefined : 'View My Grants',
        },
    );
    return grantDetail;
}

async function buildGrantDetail(grantId, emailNotificationType) {
    // Add try catch here.
    const grant = await db.getGrant({ grantId });
    const grantDetail = module.exports.getGrantDetail(grant, emailNotificationType);
    return grantDetail;
}

async function sendGrantAssignedNotficationForAgency(assignee_agency, grantDetail, assignorUserId) {
    const grantAssignedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_grant_assigned_body.html'));

    const assignor = await db.getUser(assignorUserId);

    const grantAssignedBody = mustache.render(grantAssignedBodyTemplate.toString(), {
        assignor_name: assignor.name,
        assignor_agency_name: assignor.agency.name,
        assignee_agency_name: assignee_agency.name,
    }, {
        grant_detail: grantDetail,
    });

    const emailHTML = module.exports.addBaseBranding(grantAssignedBody, {
        tool_name: 'Grants Identification Tool',
        title: 'Grants Assigned Notification',
        notifications_url: `${process.env.WEBSITE_DOMAIN}/#/grants?manageSettings=true`,
    });

    // TODO: add plain text version of the email
    const emailPlain = emailHTML.replace(/<[^>]+>/g, '');
    const emailSubject = `Grant Assigned to ${assignee_agency.name}`;
    const assginees = await db.getSubscribersForNotification(assignee_agency.id, notificationType.grantAssignment);

    const inputs = [];
    assginees.forEach((assignee) => inputs.push(
        {
            toAddress: assignee.email,
            emailHTML,
            emailPlain,
            subject: emailSubject,
        },
    ));
    asyncBatch(inputs, module.exports.deliverEmail, 2);
}

async function sendGrantAssignedEmail({ grantId, agencyIds, userId }) {
    /*
    1. Build the grant detail template
    2. For each agency
        2a. Build the grant_assigned_body
        2b. For each user part of the agency
            i. Send email
    */
    const grantDetail = await buildGrantDetail(grantId, notificationType.grantAssignment);
    const agencies = await db.getAgenciesByIds(agencyIds);
    agencies.forEach((agency) => module.exports.sendGrantAssignedNotficationForAgency(agency, grantDetail, userId));
}

async function buildDigestBody(matchedGrants) {
    const grantDetails = [];
    matchedGrants.slice(0, 30).forEach((grant) => grantDetails.push(module.exports.getGrantDetail(grant, notificationType.grantDigest)));

    const formattedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_formatted_body.html'));
    const contentSpacerTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_content_spacer.html'));
    const contentSpacerStr = contentSpacerTemplate.toString();

    let additionalBody = grantDetails.join(contentSpacerStr);

    const additionalButtonTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_additional_grants_button.html'));
    additionalBody += mustache.render(additionalButtonTemplate.toString(), { additional_grants_url: `${process.env.WEBSITE_DOMAIN}/#/grants` });

    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: 'New grants have been posted',
        body_detail: `There are ${matchedGrants.length} new grants matching your keywords and settings.`,
        additional_body: additionalBody,
    });

    return formattedBody;
}

async function sendGrantDigest({
    name, matchedGrants, recipients, openDate,
}) {
    console.log(`${name} is subscribed for notifications on ${openDate}`);

    if (!matchedGrants || matchedGrants?.length === 0) {
        console.error(`There were no grants available for ${name}`);
        return;
    }

    if (!recipients || recipients?.length === 0) {
        console.error(`There were no email recipients available for ${name}`);
        return;
    }

    const formattedBody = await buildDigestBody(matchedGrants);

    const emailHTML = module.exports.addBaseBranding(formattedBody, {
        tool_name: 'Grants Identification Tool',
        title: 'New Grants Digest',
        notifications_url: `${process.env.WEBSITE_DOMAIN}/#/grants?manageSettings=true`,
    });

    // TODO: add plain text version of the email
    const emailPlain = emailHTML.replace(/<[^>]+>/g, '');

    const inputs = [];
    recipients.forEach(
        (recipient) => inputs.push(
            {
                toAddress: recipient.trim(),
                emailHTML,
                emailPlain,
                subject: `New Grants published for ${name}`,
            },
        ),
    );
    asyncBatch(inputs, module.exports.deliverEmail, 2);
}

async function getAndSendGrantForSavedSearch({
    userSavedSearch, openDate,
}) {
    const criteriaObj = db.formatSearchCriteriaToQueryFilters(userSavedSearch.criteria);

    // NOTE: can't pass this as a separate parameter as it exceeds the complexity limit of 5
    criteriaObj.openDate = openDate;

    // Only 30 grants are shown on any given email and 31 will trigger a place to click to see more
    const response = await db.getGrantsNew(
        criteriaObj,
        await db.buildPaginationParams({ currentPage: 1, perPage: 31 }),
        {},
        userSavedSearch.tenantId,
    );

    return sendGrantDigest({
        name: userSavedSearch.name,
        matchedGrants: response.data,
        recipients: [userSavedSearch.email],
        openDate,
    });
}

async function buildAndSendUserSavedSearchGrantDigest(userId, openDate) {
    if (!openDate) {
        openDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
    }
    console.log(`Building and sending Grants Digest email for user: ${userId} on ${openDate}`);
    /*
    1. get all saved searches mapped to each user
    2. call getAndSendGrantForSavedSearch to find new grants and send the digest
    */
    const userSavedSearches = await db.getAllUserSavedSearches(userId);

    const inputs = [];
    userSavedSearches.forEach((userSavedSearch) => {
        inputs.push({
            userSavedSearch,
            openDate,
        });
    });

    await asyncBatch(inputs, getAndSendGrantForSavedSearch, 2);

    console.log(`Successfully built and sent grants digest emails for ${openDate}`);
}

async function buildAndSendGrantDigest() {
    const openDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
    console.log(`Building and sending Grants Digest email for all agencies on ${openDate}`);
    /*
    1. get all agencies with notificaiton turned on (temporarily get all agencies with a custom keyword)
    2. for each agency
        call sendGrantDigest
    */
    const agencies = await db.getAgenciesSubscribedToDigest(openDate);
    const inputs = [];
    agencies.forEach((agency) => inputs.push({
        name: agency.name,
        matchedGrants: agency.matched_grants,
        recipients: agency.recipients,
        openDate,
    }));
    await asyncBatch(inputs, module.exports.sendGrantDigest, 2);

    console.log(`Successfully built and sent grants digest emails for ${openDate}`);
}

async function sendAsyncReportEmail(recipient, signedUrl, reportType) {
    const formattedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_formatted_body.html'));

    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: `Your ${reportType} report is ready for download`,
        body_detail: `<p><a href=${signedUrl}><b>Click here</b></a> to download your file<br>Or, paste this link into your browser:<br><b>${signedUrl}</b><br><br>This link will remain active for 7 days.</p>`,
    });

    const emailHTML = module.exports.addBaseBranding(
        formattedBody,
        {
            tool_name: 'Grants Reporter Tool',
            title: `Your ${reportType} report is ready for download`,
        },
    );

    return module.exports.deliverEmail({
        toAddress: recipient,
        emailHTML,
        emailPlain: `Your ${reportType} report is ready for download. Paste this link into your browser to download it: ${signedUrl} This link will remain active for 7 days.`,
        subject: `Your ${reportType} report is ready for download`,
    });
}

module.exports = {
    sendPassCode,
    sendWelcomeEmail,
    sendGrantAssignedEmail,
    deliverEmail,
    buildGrantDetail,
    sendGrantAssignedNotficationForAgency,
    buildAndSendUserSavedSearchGrantDigest,
    buildAndSendGrantDigest,
    getAndSendGrantForSavedSearch,
    sendGrantDigest,
    getGrantDetail,
    addBaseBranding,
    buildDigestBody,
    sendAsyncReportEmail,
    ASYNC_REPORT_TYPES,
};
