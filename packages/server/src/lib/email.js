const tracer = require('dd-trace').init();
const { URL } = require('url');
const moment = require('moment');
const { capitalize } = require('lodash');
// eslint-disable-next-line import/no-unresolved
const asyncBatch = require('async-batch').default;
const fileSystem = require('fs');
const path = require('path');
const mustache = require('mustache');
const { log } = require('./logging');
const emailService = require('./email/service-email');
const db = require('../db');
const { notificationType, tags } = require('./email/constants');
const { isUSDR, isUSDRSuperAdmin } = require('./access-helpers');

const expiryMinutes = 30;
const ASYNC_REPORT_TYPES = {
    audit: {
        name: 'audit',
        emailType: tags.emailTypes.auditReport,
        errorEmailType: tags.emailTypes.auditReportError,
    },
    treasury: {
        name: 'treasury',
        emailType: tags.emailTypes.treasuryReport,
        errorEmailType: tags.emailTypes.treasuryReportError,
    },
};
const HELPDESK_EMAIL = 'grants-helpdesk@usdigitalresponse.org';
const GENERIC_FROM_NAME = 'USDR Grants';
const GRANT_FINDER_EMAIL_FROM_NAME = 'USDR Federal Grant Finder';
const ARPA_EMAIL_FROM_NAME = 'USDR ARPA Reporter';

function getUserRoleTag(user) {
    if (isUSDRSuperAdmin(user)) {
        return 'usdr_super_admin';
    }
    return `${isUSDR(user) ? 'usdr_' : ''}${user.role_name}`;
}

async function deliverEmail({
    fromName,
    toAddress,
    ccAddress,
    emailHTML,
    emailPlain,
    subject,
    emailType,
}) {
    let userTags = [];
    const recipientId = await db.getUserIdForEmail(toAddress);
    const activeContext = tracer.scope().active()?.context();
    const traceId = activeContext?.toTraceId();
    const spanId = activeContext?.toSpanId();
    if (recipientId) {
        const recipient = await db.getUser(recipientId);
        userTags = [
            `user_role=${getUserRoleTag(recipient)}`,
            `organization_id=${recipient.tenant_id}`,
            `team_id=${recipient.agency_id}`,
        ];
    }

    return emailService.getTransport().sendEmail({
        fromName,
        toAddress,
        ccAddress,
        subject,
        body: emailHTML,
        text: emailPlain,
        tags: [
            `notification_type=${emailType}`,
            ...userTags,
            `service=${process.env.DD_SERVICE}`,
            `env=${process.env.DD_ENV}`,
            `version=${process.env.DD_VERSION}`,
            `dd_trace_id=${traceId}`,
            `dd_span_id=${spanId}`,
        ],
    });
}

function buildBaseUrlSafe() {
    const baseUrl = new URL(process.env.WEBSITE_DOMAIN);
    baseUrl.searchParams.set('utm_source', 'usdr-grants');
    baseUrl.searchParams.set('utm_medium', 'email');
    return baseUrl.toString();
}

function buildNotificationsUrlSafe() {
    const notificationsUrl = new URL(process.env.WEBSITE_DOMAIN);
    notificationsUrl.pathname = 'my-profile';
    notificationsUrl.searchParams.set('utm_source', 'usdr-grants');
    notificationsUrl.searchParams.set('utm_medium', 'email');
    notificationsUrl.searchParams.set('utm_content', 'change notification preferences');
    return notificationsUrl.toString();
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
 * @param {boolean} brandDetails.includeNotificationsLink - Whether to include a link for users to
 *   update notification settings (should be true for subscriptions the user can turn off; should
 *   be false for required emails like login links; note that no default value is provided to
 *   ensure the setting is intentional for each email type)
 */
function addBaseBranding(emailHTML, brandDetails) {
    const {
        tool_name, title, preheader, includeNotificationsLink,
    } = brandDetails;
    if (typeof includeNotificationsLink !== 'boolean') {
        throw new Error('Emails must explicitly include or exclude a link to notification settings');
    }
    const baseBrandedTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/base.html'));
    const brandedHTML = mustache.render(baseBrandedTemplate.toString(), {
        tool_name,
        title,
        webview_available: false, // Preheader and webview are not setup for Grant notification email.
        preheader,
        // webview_url: 'http://localhost:8080',
        base_url_safe: buildBaseUrlSafe(),
        usdr_logo_url: 'https://grants.usdigitalresponse.org/usdr_logo_transparent.png',
        notifications_url_safe: includeNotificationsLink ? buildNotificationsUrlSafe() : null,
    }, {
        email_body: emailHTML,
    });

    return brandedHTML;
}

async function sendPassCodeEmail(email, passcode, httpOrigin, redirectTo) {
    if (!httpOrigin) {
        throw new Error('must specify httpOrigin in sendPassCodeEmail');
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
        body_detail: `<p>Your link to access USDR's Grants Tool is <a ses:no-track href=${href}>${href}</a>.
        It expires in ${expiryMinutes} minutes</p>`,
    });

    const emailHTML = addBaseBranding(
        formattedBody,
        {
            tool_name: href.includes('reporter') ? 'Grants Reporter Tool' : 'Grants Identification Tool',
            title: 'Login Passcode',
            includeNotificationsLink: false,
        },
    );

    if (process.env.DEV_LOGIN_LINK && process.env.NODE_ENV === 'development') {
        const BLUE = '\x1b[34m';
        const message = `| Login link generated: ${href} |`;
        console.log(`${BLUE}${'-'.repeat(message.length)}`);
        console.log(`${BLUE}${message}`);
        console.log(`${BLUE}${'-'.repeat(message.length)}`);
    }
    await deliverEmail({
        fromName: GENERIC_FROM_NAME,
        toAddress: email,
        emailHTML,
        emailPlain: `Your link to access USDR's Grants tool is ${href}. It expires in ${expiryMinutes} minutes`,
        subject: 'USDR Grants Tool Access Link',
        emailType: tags.emailTypes.passcode,
    });
}

async function sendReportErrorEmail(user, reportType) {
    const body = `There was an error generating your requested ${reportType.name} report. `
    + 'Someone from USDR will reach out within 24 hours to debug the problem. '
    + 'We apologize for any inconvenience.';
    const subject = `${capitalize(reportType.name)} report generation has failed for ${user.tenant.display_name}`;

    const formattedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_formatted_body.html'));

    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: subject,
        body_detail: body,
    });

    const emailHTML = addBaseBranding(
        formattedBody,
        {
            tool_name: 'Grants Reporter Tool',
            title: subject,
            includeNotificationsLink: false,
        },
    );

    await deliverEmail({
        fromName: ARPA_EMAIL_FROM_NAME,
        toAddress: user.email,
        ccAddress: HELPDESK_EMAIL,
        emailHTML,
        emailPlain: body,
        subject,
        emailType: reportType.errorEmailType,
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

    const emailHTML = addBaseBranding(
        formattedBody,
        {
            tool_name: httpOrigin.includes('reporter') ? 'Grants Reporter Tool' : 'Grants Identification Tool',
            title: 'Welcome to the USDR Grants tool',
            includeNotificationsLink: false,
        },
    );

    return deliverEmail({
        fromName: GENERIC_FROM_NAME,
        toAddress: email,
        emailHTML,
        emailPlain: `Visit USDR's Grants Tool at: ${httpOrigin}.`,
        subject: 'Welcome to USDR Grants Tool',
        emailType: tags.emailTypes.welcome,
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
    } else if (process.env.SHARE_TERMINOLOGY_ENABLED === 'true' && emailNotificationType === notificationType.grantAssignment) {
        grantsUrl.pathname = 'my-grants/shared-with-your-team';
    } else {
        grantsUrl.pathname = 'my-grants';
    }
    grantsUrl.searchParams.set('utm_source', 'subscription');
    grantsUrl.searchParams.set('utm_medium', 'email');
    grantsUrl.searchParams.set('utm_campaign', mustache.escape(emailNotificationType));
    return grantsUrl.toString();
}

function getGrantDetailViewGrantLabel(emailNotificationType) {
    switch (emailNotificationType) {
        case (notificationType.grantDigest): return undefined;
        case (notificationType.grantAssignment): {
            if (process.env.SHARE_TERMINOLOGY_ENABLED === 'true') {
                return 'See All Grants Shared With My Team';
            }
            // Fall through intentionally if SHARE_TERMINOLOGY is disabled
        }
        default:
            return 'View My Grants';
    }
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
            view_grant_label: getGrantDetailViewGrantLabel(emailNotificationType),
        },
    );
    return grantDetail;
}

async function buildGrantDetail(grant, emailNotificationType) {
    // Add try catch here.
    const grantDetail = getGrantDetail(grant, emailNotificationType);
    return grantDetail;
}

async function sendGrantAssignedEmailsForAgencyLegacy(assignee_agency, grantDetail, assignorUserId) {
    const grantAssignedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_grant_assigned_body.html'));

    const assignor = await db.getUser(assignorUserId);

    const grantAssignedBody = mustache.render(grantAssignedBodyTemplate.toString(), {
        assignor_name: assignor.name,
        assignor_agency_name: assignor.agency.name,
        assignee_agency_name: assignee_agency.name,
        grant_assigned_header: 'Grant Assigned',
        use_share_terminology: false,
    }, {
        grant_detail: grantDetail,
    });
    const baseUrl = new URL(process.env.WEBSITE_DOMAIN);
    baseUrl.pathname = 'my-grants';
    baseUrl.searchParams.set('utm_source', 'subscription');
    baseUrl.searchParams.set('utm_medium', 'email');
    baseUrl.searchParams.set('utm_campaign', 'GRANT_ASSIGNMENT');
    const emailHTML = addBaseBranding(grantAssignedBody, {
        tool_name: 'Grants Identification Tool',
        title: 'Grants Assigned Notification',
        includeNotificationsLink: true,
    });

    // TODO: add plain text version of the email
    const emailPlain = emailHTML.replace(/<[^>]+>/g, '');
    const emailSubject = `Grant Assigned to ${assignee_agency.name}`;
    const assignees = await db.getSubscribersForNotification(assignee_agency.id, notificationType.grantAssignment);

    const inputs = [];
    assignees.forEach((assignee) => inputs.push(
        {
            fromName: GRANT_FINDER_EMAIL_FROM_NAME,
            toAddress: assignee.email,
            emailHTML,
            emailPlain,
            subject: emailSubject,
            emailType: tags.emailTypes.grantAssignment,
        },
    ));
    await asyncBatch(inputs, deliverEmail, 2);
}

async function sendGrantAssignedEmailsForAgency(assignee_agency, grant, grantDetail, assignorUserId) {
    const grantAssignedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_grant_assigned_body.html'));

    const assignor = await db.getUser(assignorUserId);

    const grantAssignedBody = mustache.render(grantAssignedBodyTemplate.toString(), {
        grant_assigned_header: `${assignor.name} Shared a Grant with Your Team`,
        assignor_name: assignor.name,
        assignor_agency_name: assignor.agency.name,
        assignee_agency_name: assignee_agency.name,
        use_share_terminology: true,
    }, {
        grant_detail: grantDetail,
    });
    const baseUrl = new URL(process.env.WEBSITE_DOMAIN);
    baseUrl.pathname = 'my-grants';
    baseUrl.searchParams.set('utm_source', 'subscription');
    baseUrl.searchParams.set('utm_medium', 'email');
    baseUrl.searchParams.set('utm_campaign', 'GRANT_ASSIGNMENT');
    const emailHTML = addBaseBranding(grantAssignedBody, {
        tool_name: 'Federal Grant Finder',
        title: `${assignor.name} Shared a Grant with Your Team`,
        preheader: grant.title,
        includeNotificationsLink: true,
    });

    // TODO: add plain text version of the email
    const emailPlain = emailHTML.replace(/<[^>]+>/g, '');
    const emailSubject = `${assignor.name} Shared a Grant with Your Team`;
    const assignees = await db.getSubscribersForNotification(assignee_agency.id, notificationType.grantAssignment);

    const inputs = [];
    assignees.forEach((assignee) => inputs.push(
        {
            fromName: GRANT_FINDER_EMAIL_FROM_NAME,
            toAddress: assignee.email,
            emailHTML,
            emailPlain,
            subject: emailSubject,
            emailType: tags.emailTypes.grantAssignment,
        },
    ));
    await asyncBatch(inputs, deliverEmail, 2);
}

async function sendGrantAssignedEmails({ grantId, agencyIds, userId }) {
    /*
    1. Build the grant detail template
    2. For each agency
        2a. Build the grant_assigned_body
        2b. For each user part of the agency
            i. Send email
    */
    try {
        const grant = await db.getGrant({ grantId });
        const grantDetail = await buildGrantDetail(grant, notificationType.grantAssignment);
        const agencies = await db.getAgenciesByIds(agencyIds);
        await asyncBatch(
            agencies,
            async (agency) => {
                process.env.SHARE_TERMINOLOGY_ENABLED === 'true'
                    ? await sendGrantAssignedEmailsForAgency(agency, grant, grantDetail, userId)
                    : await sendGrantAssignedEmailsForAgencyLegacy(agency, grantDetail, userId);
            },
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
    matchedGrants.slice(0, 30).forEach((grant) => grantDetails.push(getGrantDetail(grant, notificationType.grantDigest)));

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

async function sendGrantDigestEmail({
    name, matchedGrants, matchedGrantsTotal, recipient, openDate,
}) {
    console.log(`${name} is subscribed for notifications on ${openDate}`);

    if (!matchedGrants || matchedGrants?.length === 0) {
        console.error(`There were no grants available for ${name}`);
        return;
    }

    const formattedBody = await buildDigestBody({ name, openDate, matchedGrants });
    const preheader = typeof matchedGrantsTotal === 'number' && matchedGrantsTotal > 0
        ? `You have ${Intl.NumberFormat('en-US', { useGrouping: true }).format(matchedGrantsTotal)} new ${matchedGrantsTotal > 1 ? 'grants' : 'grant'} to review!`
        : 'You have new grants to review!';

    const emailHTML = addBaseBranding(formattedBody, {
        tool_name: 'Federal Grant Finder',
        title: 'New Grants Digest',
        preheader,
        includeNotificationsLink: true,
    });

    // TODO: add plain text version of the email
    const emailPlain = emailHTML.replace(/<[^>]+>/g, '');

    await deliverEmail(
        {
            fromName: GRANT_FINDER_EMAIL_FROM_NAME,
            toAddress: recipient,
            emailHTML,
            emailPlain,
            subject: `New Grants Published for ${name}`,
            emailType: tags.emailTypes.grantDigest,
        },
    );
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

    return sendGrantDigestEmail({
        name: userSavedSearch.name,
        matchedGrants: response.data,
        matchedGrantsTotal: response.pagination.total,
        recipient: userSavedSearch.email,
        openDate,
    });
}

function yesterday() {
    return moment().subtract(1, 'day').format('YYYY-MM-DD');
}

async function buildAndSendGrantDigestEmails(userId, openDate = yesterday()) {
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

async function sendAsyncReportEmail(recipient, signedUrl, reportType) {
    const formattedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_formatted_body.html'));

    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: `Your ${reportType.name} report is ready for download`,
        body_detail: `<p><a href=${signedUrl}><b>Click here</b></a> to download your file<br>Or, paste this link into your browser:<br><b>${signedUrl}</b><br><br>This link will remain active for 7 days.</p>`,
    });

    const emailHTML = addBaseBranding(
        formattedBody,
        {
            tool_name: 'Grants Reporter Tool',
            title: `Your ${reportType.name} report is ready for download`,
            includeNotificationsLink: false,
        },
    );

    await deliverEmail({
        fromName: ARPA_EMAIL_FROM_NAME,
        toAddress: recipient,
        emailHTML,
        emailPlain: `Your ${reportType.name} report is ready for download. Paste this link into your browser to download it: ${signedUrl} This link will remain active for 7 days.`,
        subject: `Your ${reportType.name} report is ready for download`,
        emailType: reportType.emailType,
    });
}

module.exports = {
    sendPassCodeEmail,
    sendWelcomeEmail,
    sendReportErrorEmail,
    /**
     * Send emails to all subscribed parties when a grant is assigned to one or more agencies.
     */
    sendGrantAssignedEmails,
    /**
     * Send grant digest emails to all subscribed users.
     */
    buildAndSendGrantDigestEmails,
    sendGrantDigestEmail,
    // Exposed for testing
    buildDigestBody,
    sendAsyncReportEmail,
    ASYNC_REPORT_TYPES,
};
