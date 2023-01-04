const notificationType = {
    grantAssignment: 'GRANT_ASSIGNMENT',
    grantInterest: 'GRANT_INTEREST',
    grantDigest: 'GRANT_DIGEST',
};

const emailSubscriptionStatus = {
    subscribed: 'SUBSCRIBED',
    unsubscribed: 'UNSUBSCRIBED',
};

const defaultSubscriptionPreference = Object.assign(...Object.values(notificationType).map((k) => ({ [k]: emailSubscriptionStatus.unsubscribed })));

module.exports = { notificationType, emailSubscriptionStatus, defaultSubscriptionPreference };
