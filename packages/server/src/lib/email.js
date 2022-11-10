const { URL } = require('url');
const fileSystem = require('fs');
const path = require('path');
const mustache = require('mustache');
const constants = require('../db/constants');
const getTransport = require('./email/service-email');

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

    return getTransport().send({
        toAddress: email,
        subject: 'USDR Grants Tool Access Link',
        body: `<p>Your link to access USDR's Grants Tool is <a href=${href}>${href}</a>.
     It expires in ${expiryMinutes} minutes</p>`,
    });
}

function sendWelcomeEmail(email, httpOrigin) {
    if (!httpOrigin) {
        throw new Error('must specify httpOrigin in sendWelcomeEmail');
    }


    return getTransport().send({
        toAddress: email,
        subject: 'Welcome to USDR Grants Tool',
        body: `<p>Visit USDR's Grants Tool at:
     <a href="${httpOrigin}">${httpOrigin}</a>.`,
    });
}

function sendGrantNotificationEmail(toAddress, httpOrigin, grant, assignor, assignee_agency) {
    if (!httpOrigin) {
        throw new Error('must specify httpOrigin in sendGrantNotificationEmail');
    }
    console.log(fileSystem.existsSync('../static/email_templates/base.html'));

    const baseTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/base.html'));
    const grantDetailTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_grant_detail.html'));
    const grantAssignedBodyTemplate = fileSystem.readFileSync(path.join(__dirname, '../static/email_templates/_grant_assigned_body.html'));
    // in a loop of each individual grant.
    const grantDetail = mustache.render(
        grantDetailTemplate.toString(), {
            title: grant.title,
            description: grant.description,
            status: grant.status,
            open_date: grant.open_date,
            close_date: grant.close_date,
            award_floor: grant.award_floor,
            award_ceiling: grant.award_ceiling,
            estimated_funding: grant.estimated_funding,
            cost_sharing: grant.cost_sharing,
            link_url: '',
        },
    );
    fileSystem.writeFileSync('test_1.html', grantDetail);
    console.log(assignor.name);
    console.log(assignor.agency.name);
    console.log(assignee_agency);
    console.log(assignee_agency.name);
    const grantAssignedBody = mustache.render(grantAssignedBodyTemplate.toString(), {
        assignor_name: assignor.name,
        assignor_agency_name: assignor.agency.name,
        assignee_agency_name: assignee_agency.name,
    }, {
        grant_detail: grantDetail,
    });
    fileSystem.writeFileSync('test_2.html', grantAssignedBody);

    const newHtmlBody = mustache.render(baseTemplate.toString(), {
        tool_name: 'Grants Identification Tool',
    }, {
        email_body: grantAssignedBody,
    });
    console.log(newHtmlBody.includes('NOFO'));
    fileSystem.writeFileSync('test.html', newHtmlBody);

    return getTransport().send({
        toAddress,
        subject: `Grant assigned to: ${assignee_agency.name}`,
        body: `${newHtmlBody}`,
    });
}
// sendGrantNotificationEmail('asridhar@usdigitalresponse.org', 'localhost:3000');


module.exports = { sendPassCode, sendWelcomeEmail, sendGrantNotificationEmail };
