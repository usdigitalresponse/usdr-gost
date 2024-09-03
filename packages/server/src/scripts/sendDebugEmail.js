#!/usr/bin/env node
const inquirer = require('inquirer');
const knex = require('../db/connection');
const { TABLES } = require('../db/constants');
const db = require('../db');
const email = require('../lib/email');
const seedGrants = require('../../seeds/dev/ref/grants');
const seedUsers = require('../../seeds/dev/ref/users');

async function sendWelcome() {
    await email.sendWelcomeEmail(
        'test@example.com',
        process.env.WEBSITE_DOMAIN,
    );
}

async function sendPassCode() {
    const loginEmail = 'admin@example.com';
    const passcode = await db.createAccessToken(loginEmail);
    await email.sendPassCodeEmail(
        loginEmail,
        passcode,
        process.env.WEBSITE_DOMAIN,
        null,
    );
}

async function sendGrantDigest() {
    const grantIds = seedGrants.grants.slice(0, 3).map((grant) => grant.grant_id);
    const grants = await knex(TABLES.grants).whereIn('grant_id', grantIds);
    await email.sendGrantDigestEmail({
        name: 'Test agency',
        matchedGrants: grants,
        matchedGrantsTotal: grantIds.length,
        recipient: 'test@example.com',
        openDate: '2024-01-01',
    });
}

async function sendGrantAssigned() {
    // Use Dallas since there's only one user in the agency, so we should get only 1 email sent
    const user = seedUsers.find((seedUser) => seedUser.email === 'user1@dallas.gov');
    await email.sendGrantAssignedEmails({
        grantId: seedGrants.grants[0].grant_id,
        agencyIds: [user.agency_id],
        userId: user.id,
    });
}

async function sendAuditReport() {
    await email.sendAsyncReportEmail(
        'test@example.com',
        `${process.env.API_DOMAIN}/api/audit_report/fake_key`,
        email.ASYNC_REPORT_TYPES.audit,
    );
}

async function sendTreasuryReport() {
    await email.sendAsyncReportEmail(
        'test@example.com',
        `${process.env.API_DOMAIN}/api/treasury_report/fake_key`,
        email.ASYNC_REPORT_TYPES.treasury,
    );
}

async function sendAuditReportError() {
    const userId = seedUsers.find((seedUser) => seedUser.email === 'admin@example.com').id;
    const user = await db.getUser(userId);
    await email.sendReportErrorEmail(user, email.ASYNC_REPORT_TYPES.audit);
}

async function sendTreasuryReportError() {
    const userId = seedUsers.find((seedUser) => seedUser.email === 'admin@example.com').id;
    const user = await db.getUser(userId);
    await email.sendReportErrorEmail(user, email.ASYNC_REPORT_TYPES.treasury);
}

const emailTypes = {
    'new user welcome': sendWelcome,
    'login passcode': sendPassCode,
    'grant digest': sendGrantDigest,
    'grant assigned': sendGrantAssigned,
    'audit report generation completed': sendAuditReport,
    'treasury report generation completed': sendTreasuryReport,
    'audit report generation failed': sendAuditReportError,
    'treasury report generation failed': sendTreasuryReportError,
};

async function main() {
    const answers = await inquirer.prompt([
        { name: 'emailType', type: 'list', choices: Object.keys(emailTypes) },
    ]);
    try {
        const sendEmail = emailTypes[answers.emailType];
        await sendEmail();
    } catch (e) {
        console.error('Error sending email. Have you run the DB seed?', e);
    }
}

if (require.main === module) {
    process.on('SIGINT', () => {
        console.log('Exiting.');
        process.exit();
    });
    main().then(() => process.exit());
}
