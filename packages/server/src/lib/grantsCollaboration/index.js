const {
    saveNoteRevision, getOrganizationNotesForGrant, getOrganizationNotesForGrantByUser, deleteGrantNotesByUser,
} = require('./notes');
const {
    followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
} = require('./followers');

module.exports = {
    saveNoteRevision, getOrganizationNotesForGrant, getOrganizationNotesForGrantByUser, deleteGrantNotesByUser, followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
};
