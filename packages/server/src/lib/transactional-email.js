// eslint-disable-next-line import/no-unresolved
const fileSystem = require('fs');
const path = require('path');
const mustache = require('mustache');
const knex = require('../db/connection');
const { addBaseBranding, deliverEmail } = require('./email');

async function sendTransactionalEmail(toAddress, bodyTitle, bodyHTML, bodyPlain, toolName, subject) {
    console.log(__dirname);
    console.log(path.join(__dirname, '../static/email_templates/_formatted_body.html'));

    const fullPath = ''; // FIXME pwd + ../static/email_templates/_formatted_body.html
    const formattedBodyTemplate = fileSystem.readFileSync(fullPath);

    /*eslint-disable */
    const formattedBody = mustache.render(formattedBodyTemplate.toString(), {
        body_title: bodyTitle,
        body_detail: bodyHTML,
    });

    const emailHTML = addBaseBranding(
        formattedBody,
        {
            tool_name: toolName,
            title: subject,
        },
    );
    return await deliverEmail({
        toAddress,
        emailHTML,
        emailPlain: bodyPlain,
        subject,
    });
}

async function sendMaintenanceEmailToAllUsers(offset) {
    const users = await knex('users').orderBy([
        { column: 'tenant_id', order: 'asc' },
        { column: 'agency_id', order: 'asc' },
        { column: 'name', order: 'asc' },
    ]).limit(5).offset(offset);
    /*eslint-disable */

    for (const user of users) {
        console.log(`Sending email to ${user.email}`);
        await sendTransactionalEmail(
            'asridhar+27@usdigitalresponse.org',
            'Scheduled Maintenance',
            `<p>We would like to inform you that scheduled maintenance is planned for the Grant ID Tool and ARPA Reporter Tool. During the maintenance period, the site may not be available at times.
            <br />
            <br />
            <b>Maintenance Period:</b> Thursday, March 2, 5 PM - 3 AM PT
            <br />
            <br />
            Our team will be performing necessary updates and upgrades to ensure that the tools continue to provide you with the best user experience.
            <br />
            <br />
            Thank you for your understanding and cooperation.
            `,
            `
            We would like to inform you that scheduled maintenance is planned for the Grant ID Tool and ARPA Reporter Tool. During the maintenance period, the site may not be available at times.
            Maintenance Period: Thursday, March 2, 5 PM - 3 AM PT
            Our team will be performing necessary updates and upgrades to ensure that the tools continue to provide you with the best user experience.
            Thank you for your understanding and cooperation.
            `,
            'Grants Tools',
            'Scheduled Maintenance on USDR Grant Tools',
        );
    }
}

module.exports = { sendMaintenanceEmailToAllUsers };
