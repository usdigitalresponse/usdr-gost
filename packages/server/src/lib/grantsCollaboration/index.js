const { saveNoteRevision, getOrganizationNotesForGrant, getOrganizationNotesForGrantByUser } = require('./notes');
const {
    followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
} = require('./followers');

module.exports = {
    saveNoteRevision, getOrganizationNotesForGrant, getOrganizationNotesForGrantByUser, followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
};
