const notificationType = Object.freeze({
    grantAssignment: 'GRANT_ASSIGNMENT',
    grantInterest: 'GRANT_INTEREST',
    grantDigest: 'GRANT_DIGEST',
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

module.exports = { notificationType, emailSubscriptionStatus, defaultSubscriptionPreference };
