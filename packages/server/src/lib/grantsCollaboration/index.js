const { saveNoteRevision, getOrganizationNotesForGrant } = require('./notes');
const {
    followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
} = require('./followers');

module.exports = {
    saveNoteRevision, getOrganizationNotesForGrant, followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
};
