const { saveNoteRevision, getOrganizationNotesForGrant } = require('./notes');
const { followGrant, unfollowGrant } = require('./followers');

module.exports = {
    saveNoteRevision, getOrganizationNotesForGrant, followGrant, unfollowGrant,
};
