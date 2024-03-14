const { URL } = require('url');
const moment = require('moment');
// eslint-disable-next-line import/no-unresolved
const asyncBatch = require('async-batch').default;
const fileSystem = require('fs');
const path = require('path');
const mustache = require('mustache');
const { log } = require('./logging');
const emailService = require('./email/service-email');
const db = require('../db');
const { notificationType } = require('./email/constants');

const expiryMinutes = 30;
const ASYNC_REPORT_TYPES = {
    audit: 'audit',
    treasury: 'treasury',
};
const HELPDESK_EMAIL = 'grants-helpdesk@usdigitalresponse.org';

async function deliverEmail({
    fromName,
    toAddress,
    ccAddress,
    emailHTML,
    emailPlain,
    subject,
}) {
    return emailService.getTransport().sendEmail({
        fromName,
        toAddress,
        ccAddress,
        subject,
        body: emailHTML,
        text: emailPlain,
    });
}

function buildBaseUrlSafe() {
    const baseUrl = new URL(process.env.WEBSITE_DOMAIN);
    baseUrl.searchParams.set('utm_source', 'subscription');
    baseUrl.searchParams.set('utm_medium', 'email');
    return baseUrl.toString();
}

/**
 * Adds the base email HTML around the email body HTML. Specifically, adds the USDR logo header,
 * footer, title, preheader, etc.
 *
 * @param {string} emailHTML - Rendered email body HTML
 * @param {object} brandDetails - Options to control how the base branding is rendered
 * @param {string} brandDetails.tool_name - Name of the product triggering the email, rendered
 *   underneath the USDR logo
 * @param {string} brandDetails.title - Rendered as the HTML <title> (most email programs ignore)
 * @param {string} brandDetails.preheader - Preview text for the email (most email programs
 *   render this, often truncated, after the subject line in your inbox)
 * @param {string} brandDetails.notifications_url - URL where the user can manage notification settings
 */
function addBaseBranding(emailHTML, brandDetails) {
    const {
        tool_name, title, preheader, notifications_url,
    } = brandDetails;
    const baseBrandedTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/base.html'));
    const brandedHTML = mustache.render(baseBrandedTemplate.toString(), {
        tool_name,
        title,
        webview_available: false, // Preheader and webview are not setup for Grant notification email.
        preheader,
        // webview_url: 'http://localhost:8080',
        base_url_safe: buildBaseUrlSafe(),
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
        const BLUE = '\x1b[34m';
        const message = `| Login link generated: ${href} |`;
        console.log(`${BLUE}${'-'.repeat(message.length)}`);
        console.log(`${BLUE}${message}`);
        console.log(`${BLUE}${'-'.repeat(message.length)}`);
    }
    return module.exports.deliverEmail({
        toAddress: email,
        emailHTML,
        emailPlain: `Your link to access USDR's Grants tool is ${href}. It expires in ${expiryMinutes} minutes`,
        subject: 'USDR Grants Tool Access Link',
    });
}

async function sendReportErrorEmail(user, reportType) {
    const body = `There was an error generating a your requested ${reportType} Report. `
    + 'Someone from USDR will reach out within 24 hours to debug the problem. '
    + 'We apologize for any inconvenience.';
    const subject = `${reportType} Report generation has failed for ${user.tenant.display_name}`;

    const formattedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_formatted_body.html'));

    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: subject,
        body_detail: body,
    });

    const emailHTML = module.exports.addBaseBranding(
        formattedBody,
        {
            tool_name: 'Grants Reporter Tool',
            title: subject,
        },
    );

    return module.exports.deliverEmail({
        toAddress: user.email,
        ccAddress: HELPDESK_EMAIL,
        emailHTML,
        emailPlain: body,
        subject,
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

function buildGrantDetailUrlSafe(grantId, emailNotificationType) {
    const grantDetailUrl = new URL(process.env.WEBSITE_DOMAIN);
    grantDetailUrl.pathname = `grants/${mustache.escape(grantId)}`;
    grantDetailUrl.searchParams.set('utm_source', 'usdr-grants');
    grantDetailUrl.searchParams.set('utm_medium', 'email');
    grantDetailUrl.searchParams.set('utm_campaign', mustache.escape(emailNotificationType));
    grantDetailUrl.searchParams.set('utm_content', 'grant-details');
    return grantDetailUrl.toString();
}

function buildGrantsUrlSafe(emailNotificationType) {
    const grantsUrl = new URL(process.env.WEBSITE_DOMAIN);
    if (emailNotificationType === notificationType.grantDigest) {
        grantsUrl.pathname = 'grants';
    } else {
        grantsUrl.pathname = 'my-grants';
    }
    grantsUrl.searchParams.set('utm_source', 'subscription');
    grantsUrl.searchParams.set('utm_medium', 'email');
    grantsUrl.searchParams.set('utm_campaign', mustache.escape(emailNotificationType));
    return grantsUrl.toString();
}

function getGrantDetail(grant, emailNotificationType) {
    const grantDetailTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_grant_detail.html'));
    const description = grant.description?.substring(0, 380).replace(/(<([^>]+)>)/ig, '');
    const grantDetail = mustache.render(
        grantDetailTemplate.toString(), {
            title: grant.title,
            description,
            status: grant.opportunity_status,
            show_date_range: grant.open_date && grant.close_date,
            open_date: grant.open_date ? new Date(grant.open_date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : undefined,
            close_date: grant.close_date ? new Date(grant.close_date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : undefined,
            award_floor: grant.award_floor || '$0',
            award_ceiling: grant.award_ceiling || 'Not available',
            // estimated_funding: grant.estimated_funding, TODO: add once field is available in the database.
            cost_sharing: grant.cost_sharing,
            link_url_safe: process.env.NEW_GRANT_DETAILS_PAGE_ENABLED === 'true'
                ? buildGrantDetailUrlSafe(grant.grant_id, emailNotificationType)
                : `https://www.grants.gov/search-results-detail/${mustache.escape(grant.grant_id)}`,
            link_description: process.env.NEW_GRANT_DETAILS_PAGE_ENABLED === 'true'
                ? 'Grant Finder'
                : 'Grants.gov',
            grants_url_safe: buildGrantsUrlSafe(emailNotificationType),
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
    const baseUrl = new URL(process.env.WEBSITE_DOMAIN);
    baseUrl.pathname = 'my-grants';
    baseUrl.searchParams.set('utm_source', 'subscription');
    baseUrl.searchParams.set('utm_medium', 'email');
    baseUrl.searchParams.set('utm_campaign', 'GRANT_ASSIGNMENT');
    const emailHTML = module.exports.addBaseBranding(grantAssignedBody, {
        tool_name: 'Grants Identification Tool',
        title: 'Grants Assigned Notification',
        notifications_url: baseUrl.toString(),
    });

    // TODO: add plain text version of the email
    const emailPlain = emailHTML.replace(/<[^>]+>/g, '');
    const emailSubject = `Grant Assigned to ${assignee_agency.name}`;
    const assignees = await db.getSubscribersForNotification(assignee_agency.id, notificationType.grantAssignment);

    const inputs = [];
    assignees.forEach((assignee) => inputs.push(
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
    try {
        const grantDetail = await buildGrantDetail(grantId, notificationType.grantAssignment);
        const agencies = await db.getAgenciesByIds(agencyIds);
        await asyncBatch(
            agencies,
            (agency) => { module.exports.sendGrantAssignedNotficationForAgency(agency, grantDetail, userId); },
            2,
        );
    } catch (err) {
        log.error({
            err, grantId, agencyIds, userId,
        }, 'Failed to send grant assigned email');
        throw err;
    }
}

async function buildDigestBody({ name, openDate, matchedGrants }) {
    const grantDetails = [];
    matchedGrants.slice(0, 30).forEach((grant) => grantDetails.push(module.exports.getGrantDetail(grant, notificationType.grantDigest)));

    const formattedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_formatted_body.html'));
    const contentSpacerTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_content_spacer.html'));
    const contentSpacerStr = contentSpacerTemplate.toString();

    let additionalBody = grantDetails.join(contentSpacerStr).concat(contentSpacerStr);

    const additionalButtonTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_additional_grants_button.html'));
    additionalBody += mustache.render(additionalButtonTemplate.toString(), { additional_grants_url: `${process.env.WEBSITE_DOMAIN}/grants` });

    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: `${name} - ${matchedGrants.length} NEW GRANTS`,
        body_detail: moment(openDate).format('MMMM Do YYYY'),
        additional_body: additionalBody,
    });

    return formattedBody;
}

async function sendGrantDigest({
    name, matchedGrants, matchedGrantsTotal, recipients, openDate,
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

    const formattedBody = await buildDigestBody({ name, openDate, matchedGrants });
    const preheader = typeof matchedGrantsTotal === 'number' && matchedGrantsTotal > 0
        ? `You have ${Intl.NumberFormat('en-US', { useGrouping: true }).format(matchedGrantsTotal)} new ${matchedGrantsTotal > 1 ? 'grants' : 'grant'} to review!`
        : 'You have new grants to review!';

    const emailHTML = module.exports.addBaseBranding(formattedBody, {
        tool_name: 'Federal Grant Finder',
        title: 'New Grants Digest',
        preheader,
        notifications_url: (process.env.ENABLE_MY_PROFILE === 'true') ? `${process.env.WEBSITE_DOMAIN}/my-profile` : `${process.env.WEBSITE_DOMAIN}/grants?manageSettings=true`,
    });

    // TODO: add plain text version of the email
    const emailPlain = emailHTML.replace(/<[^>]+>/g, '');

    const inputs = [];
    recipients.forEach(
        (recipient) => inputs.push(
            {
                fromName: 'USDR Federal Grant Finder',
                toAddress: recipient.trim(),
                emailHTML,
                emailPlain,
                subject: `New Grants Published for ${name}`,
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
        false,
    );

    return sendGrantDigest({
        name: userSavedSearch.name,
        matchedGrants: response.data,
        matchedGrantsTotal: response.pagination.total,
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

    console.log(`Successfully built and sent grants digest emails for ${inputs.length} saved searches on ${openDate}`);
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
        matchedGrantsTotal: agency.matched_grants.length,
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
    sendReportErrorEmail,
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
