const { URL } = require('url');
const fileSystem = require('fs');
const path = require('path');
const mustache = require('mustache');
const emailService = require('./email/service-email');
const db = require('../db');

const expiryMinutes = 30;

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

    return emailService.getTransport().send({
        toAddress: email,
        subject: 'USDR Grants Tool Access Link',
        body: `<p>Your link to access USDR's Grants Tool is <a href=${href}>${href}</a>.
     It expires in ${expiryMinutes} minutes</p>`,
        text: `Your link to access USDR's Grants tool is ${href}. It expires in ${expiryMinutes} minutes`,
    });
}

function sendWelcomeEmail(email, httpOrigin) {
    if (!httpOrigin) {
        throw new Error('must specify httpOrigin in sendWelcomeEmail');
    }

    return emailService.getTransport().send({
        toAddress: email,
        subject: 'Welcome to USDR Grants Tool',
        body: `<p>Visit USDR's Grants Tool at:
     <a href="${httpOrigin}">${httpOrigin}</a>.`,
        text: `Visit USDR's Grants Tool at: ${httpOrigin}.`,
    });
}

async function buildGrantDetail(grantId) {
    const grant = await db.getGrant({ grantId });
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

async function deliverGrantAssigntmentToAssignee(toAddress, emailHTML, emailPlain, subject) {
    return emailService.getTransport().send({
        toAddress,
        subject,
        body: emailHTML,
        text: emailPlain,
    });
}

async function sendGrantAssignedNotficationForAgency(assignee_agency, grantDetail, assignorUserId) {
    const baseTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/base.html'));
    const grantAssignedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_grant_assigned_body.html'));

    const assignor = await db.getUser(assignorUserId);

    const grantAssignedBody = mustache.render(grantAssignedBodyTemplate.toString(), {
        assignor_name: assignor.name,
        assignor_agency_name: assignor.agency.name,
        assignee_agency_name: assignee_agency.name,
    }, {
        grant_detail: grantDetail,
    });
    const emailHTML = mustache.render(baseTemplate.toString(), {
        tool_name: 'Grants Identification Tool',
        title: 'Grants Assigned Notification',
        webview_available: false, // Preheader and webview are not setup for Grant notification email.
        // preheader: 'Test preheader',
        // webview_url: 'http://localhost:8080',
        usdr_url: 'http://usdigitalresponse.org',
        usdr_logo_url: 'https://grants.usdigitalresponse.org/usdr_logo_transparent.png',
        // Manually send an email to Mindy for now to change notification preferences.
        notifications_url: 'mailto:mindy@usdigitalresponse.org?subject=Unsubscribe&body=Please unsubscribe me from the grant assigned notification email.',
    }, {
        email_body: grantAssignedBody,
    });
    const emailPlain = emailHTML;
    const emailSubject = `Grant Assigned to ${assignee_agency.name}`;
    const assginees = await db.getUsersByAgency(assignee_agency.id);

    assginees.forEach((assignee) => module.exports.deliverGrantAssigntmentToAssignee(assignee.email, emailHTML, emailPlain, emailSubject));
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

module.exports = {
    sendPassCode,
    sendWelcomeEmail,
    sendGrantAssignedEmail,
    deliverGrantAssigntmentToAssignee,
    buildGrantDetail,
    sendGrantAssignedNotficationForAgency,
};
