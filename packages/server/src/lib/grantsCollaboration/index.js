const { saveNoteRevision, getOrganizationNotesForGrant } = require('./notes');
const { followGrant, unfollowGrant, getFollowerForGrant } = require('./followers');

module.exports = {
    saveNoteRevision, getOrganizationNotesForGrant, followGrant, unfollowGrant, getFollowerForGrant,
};
