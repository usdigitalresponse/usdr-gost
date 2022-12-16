const { URL } = require('url');
const fileSystem = require('fs');
const path = require('path');
const mustache = require('mustache');
const emailService = require('./email/service-email');
const db = require('../db');

const expiryMinutes = 30;

async function deliverEmail({
    toAddress,
    emailHTML,
    emailPlain,
    subject,
}) {
    // Ensures grants-related emails are only sent in non-production environments.
    if (subject.toLowerCase().includes('grant') && process.env.WEBSITE_DOMAIN === 'https://grants.usdigitalresponse.org') {
        console.log(`Attempted to send an email to ${toAddress} with subject ${subject}.`);
        return undefined;
    }

    return emailService.getTransport().send({
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
        // Manually send an email to Mindy for now to change notification preferences.
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

function getGrantDetail(grant) {
    const grantDetailTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_grant_detail.html'));
    const grantDetail = mustache.render(
        grantDetailTemplate.toString(), {
            title: grant.title,
            description: grant.description,
            status: grant.status,
            show_date_range: grant.open_date && grant.close_date,
            open_date: grant.open_date ? new Date(grant.open_date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : undefined,
            close_date: grant.close_date ? new Date(grant.close_date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : undefined,
            award_floor: grant.award_floor || '$0',
            award_ceiling: grant.award_ceiling || 'Not available',
            // estimated_funding: grant.estimated_funding, TODO: add once field is available in the database.
            cost_sharing: grant.cost_sharing,
            link_url: `https://www.grants.gov/web/grants/view-opportunity.html?oppId=${grant.grant_id}`,
        },
    );
    return grantDetail;
}

async function buildGrantDetail(grantId) {
    // Add try catch here.
    const grant = await db.getGrant({ grantId });
    const grantDetail = module.exports.getGrantDetail(grant);
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
        notifications_url: 'mailto:grants-helpdesk@usdigitalresponse.org?subject=Unsubscribe&body=Please unsubscribe me from the grant assigned notification email.',
    });
    const emailPlain = emailHTML;
    const emailSubject = `Grant Assigned to ${assignee_agency.name}`;
    const assginees = await db.getUsersByAgency(assignee_agency.id);

    assginees.forEach((assignee) => module.exports.deliverEmail(
        {
            toAddress: assignee.email,
            emailHTML,
            emailPlain,
            subject: emailSubject,
        },
    ));
}

async function sendGrantAssignedEmail({ grantId, agencyIds, userId }) {
    /*
    1. Build the grant detail template
    2. For each agency
        2a. Build the grant_assigned_body
        2b. For each user part of the agency
            i. Send email
    */
    const grantDetail = await buildGrantDetail(grantId);
    const agencies = await db.getAgenciesByIds(agencyIds);
    agencies.forEach((agency) => module.exports.sendGrantAssignedNotficationForAgency(agency, grantDetail, userId));
}

async function sendGrantDigestForAgency(agency) {
    const newGrants = await db.getNewGrantsForAgency(agency);

    if (newGrants.length === 0) {
        return undefined;
    }

    const grantDetails = [];
    newGrants.slice(0, 3).forEach((grant) => grantDetails.push(module.exports.getGrantDetail(grant)));

    const formattedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_formatted_body.html'));
    const contentSpacerTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_content_spacer.html'));
    const contentSpacerStr = contentSpacerTemplate.toString();

    let additionalBody = grantDetails.join(contentSpacerStr);

    if (newGrants.length > 3) {
        const additionalButtonTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_additional_grants_button.html'));
        additionalBody += mustache.render(additionalButtonTemplate.toString(), { additional_grants_url: process.env.WEBSITE_DOMAIN });
    }

    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: 'New grants have been posted',
        body_detail: `There are ${newGrants.length} new grants matching your agency's keywords and settings.`,
        additional_body: additionalBody,
    });

    const emailHTML = module.exports.addBaseBranding(formattedBody, {
        tool_name: 'Grants Identification Tool',
        title: 'New Grants Digest',
        notifications_url: 'mailto:grants-helpdesk@usdigitalresponse.org?subject=Unsubscribe&body=Please unsubscribe me from the grant digest notification email.',
    });
    const emailPlain = emailHTML;

    fileSystem.writeFileSync('rendered.html', emailHTML);
    const recipients = await db.getUsersByAgency(agency.id);
    console.log(recipients.length);
    recipients.forEach(
        (recipient) => module.exports.deliverEmail(
            {
                toAddress: recipient.email,
                emailHTML,
                emailPlain,
                subject: `New Grants published for ${agency.name}`,
            },
        ),
    );

    return undefined;
}

async function buildAndSendGrantDigest() {
    /*
    1. get all agencies with notificaiton turned on (temporarily get all agencies with a custom keyword)
    2. for each agency
        call sendGrantDigestForAgency
    */
    const agencies = await db.getAgenciesSubscribedToDigest();
    agencies.forEach((agency) => module.exports.sendGrantDigestForAgency(agency));
}

module.exports = {
    sendPassCode,
    sendWelcomeEmail,
    sendGrantAssignedEmail,
    deliverEmail,
    buildGrantDetail,
    sendGrantAssignedNotficationForAgency,
    buildAndSendGrantDigest,
    sendGrantDigestForAgency,
    getGrantDetail,
    addBaseBranding,
};
