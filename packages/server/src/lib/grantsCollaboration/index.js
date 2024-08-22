const { saveNoteRevision, getOrganizationNotesForGrant } = require('./notes');
const {
    followGrant, unfollowGrant, getFollowersForGrant,
} = require('./followers');

module.exports = {
    saveNoteRevision, getOrganizationNotesForGrant, followGrant, unfollowGrant, getFollowersForGrant,
};
