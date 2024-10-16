// Types of emails that a user may subscribe to
const notificationType = Object.freeze({
    grantAssignment: 'GRANT_ASSIGNMENT',
    grantInterest: 'GRANT_INTEREST',
    grantDigest: 'GRANT_DIGEST',
    grantFinderUpdates: 'GRANT_FINDER_UPDATES',
    grantActivity: 'GRANT_ACTIVITY',
});

const emailSubscriptionStatus = Object.freeze({
    subscribed: 'SUBSCRIBED',
    unsubscribed: 'UNSUBSCRIBED',
});

const defaultSubscriptionPreference = Object.freeze(
    Object.assign(
        ...Object.values(notificationType).map(
            (k) => ({ [k]: emailSubscriptionStatus.subscribed }),
        ),
    ),
);

const tags = Object.freeze(
    {
        emailTypes: {
            passcode: 'passcode',
            grantAssignment: 'grant_assignment',
            auditReport: 'audit_report',
            treasuryReport: 'treasury_report',
            welcome: 'welcome',
            grantDigest: 'grant_digest',
            treasuryReportError: 'treasury_report_error',
            auditReportError: 'audit_report_error',
        },
    },
);

module.exports = {
    notificationType, emailSubscriptionStatus, defaultSubscriptionPreference, tags,
};
