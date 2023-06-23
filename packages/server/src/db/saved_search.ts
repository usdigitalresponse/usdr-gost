
const knex = require('./connection');
const { IPaginateParams, IWithPagination } = require('knex-paginate');

interface SavedSearch {
    id?: number
    agencyId: number
    userId: number
    criteria: string
    createdAt?: string
}

// Creates and saves a new saved search, given a name, agency ID, user ID, and criteria
async function createSavedSearch(searchItem: SavedSearch): Promise<SavedSearch> {

    const response = await knex
        .insert(searchItem)
        .into('grants_saved_searches');

    return {
        ...searchItem,
        id: response[0].id,
        createdAt: new Date(response[0].created_at).toISOString(),
    };
}

// Retrieves saved searches, given an agency ID, result limit, and result offset
async function getSavedSearches(userId: number, agencyId: number, paginationParams: typeof IPaginateParams): Promise<typeof IWithPagination> {
    const response = await knex('grants_saved_searches')
        .where('user_id', userId)
        .andWhere('agency_id', agencyId)
        .paginate(paginationParams)

    return response
}

// Deletes saved searches, given an ID and agency ID (not just ID)
async function deleteSavedSearch(searchId: number, agencyId: number): Promise<boolean> {

    try {
        await knex('grants_saved_searches')
            .where('id', searchId)
            .andWhere('agency_id', agencyId)
            .del();
    } catch (e) {
        console.error(`Unable to delete ${searchId}. Error: ${e}`)
        return false
    }

    return true
}

module.exports = {
    createSavedSearch,
    getSavedSearches,
    deleteSavedSearch,
};
