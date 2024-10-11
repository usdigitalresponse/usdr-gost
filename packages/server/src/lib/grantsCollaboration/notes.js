async function saveNoteRevision(knex, grantId, userId, text) {
    let grantNoteId;

    const grantNotesRevisionId = await knex.transaction(async (trx) => {
        const existingNote = await trx('grant_notes')
            .select('id')
            .where({ grant_id: grantId, user_id: userId })
            .first();

        if (existingNote) {
            grantNoteId = existingNote.id;
        } else {
            const [newNoteId] = await trx('grant_notes')
                .insert({
                    grant_id: grantId,
                    user_id: userId,
                })
                .returning('id');
            grantNoteId = newNoteId.id;
        }

        const [revisionId] = await trx('grant_notes_revisions')
            .insert({
                grant_note_id: grantNoteId,
                text,
            })
            .returning('id');

        return revisionId;
    });

    return grantNotesRevisionId;
}

async function getCurrentNoteRevisions(
    knex,
    { grantId, organizationId, userId } = {},
    { cursor, limit = 50 } = {},
) {
    const recentRevsQuery = knex
        .select('r.*')
        .from({ r: 'grant_notes_revisions' })
        .whereRaw('r.grant_note_id = grant_notes.id')
        .orderBy('r.created_at', 'desc')
        .limit(2);

    const revQuery = knex
        .select(knex.raw(`recent_revs.*, count(recent_revs.*) OVER() > 1 as is_revised`))
        .fromRaw(`(${recentRevsQuery.toQuery()}) as recent_revs`)
        .orderBy('recent_revs.created_at', 'desc')
        .limit(1);

    let query = knex('grant_notes')
        .select([
            'grant_notes.id',
            'grant_notes.created_at',
            'grant_notes.grant_id',
            'rev.id as latest_revision_id',
            'rev.created_at as revised_at',
            'rev.text',
            'rev.is_revised as is_revised',
            'users.id as user_id',
            'users.name as user_name',
            'users.email as user_email',
            'users.avatar_color as user_avatar_color',
            'tenants.id as organization_id',
            'tenants.display_name as organization_name',
            'agencies.id as team_id',
            'agencies.name as team_name',
        ])
        .joinRaw(`LEFT JOIN LATERAL (${revQuery.toQuery()}) AS rev ON rev.grant_note_id = grant_notes.id`)
        .join('users', 'users.id', 'grant_notes.user_id')
        .join('agencies', 'agencies.id', 'users.agency_id')
        .join('tenants', 'tenants.id', 'users.tenant_id');

    // Conditionally applying filters based on grantID if it is null or undefined or not
    if (grantId !== null && grantId !== undefined) {
        query = query.where('grant_notes.grant_id', grantId);
    }

    // Conditionally applying filters based on organizationID if it is null or undefined or not
    if (organizationId !== null && organizationId !== undefined) {
        query = query.andWhere('tenants.id', organizationId);
    }

    // Conditionally applying filters based on userID if it is null or undefined or not
    if (userId !== null && userId !== undefined) {
        query = query.andWhere('grant_notes.user_id', userId);
    }

    if (cursor) {
        query = query.andWhere('rev.id', '<', cursor);
    }

    const notesWithLead = await query
        .orderBy('rev.created_at', 'desc')
        .limit(limit + 1);
    const hasMore = notesWithLead.length > limit;

    // remove forward looking lead
    const notes = hasMore ? notesWithLead.slice(0, -1) : notesWithLead;

    return {
        notes: notes.map((note) => ({
            id: note.latest_revision_id,
            createdAt: note.revised_at,
            isRevised: note.is_revised,
            text: note.text,
            grant: { id: note.grant_id },
            user: {
                id: note.user_id,
                name: note.user_name,
                email: note.user_email,
                avatarColor: note.user_avatar_color,
                team: {
                    id: note.team_id,
                    name: note.team_name,
                },
                organization: {
                    id: note.organization_id,
                    name: note.organization_name,
                },
            },
        })),
        pagination: {
            next: hasMore ? notes[notes.length - 1].latest_revision_id : null,
        },
    };
}

async function getOrganizationNotesForGrantByUser(
    knex,
    organizationId,
    userId,
    grantId,
    { cursor, limit = 50 } = {},
) {
    return getCurrentNoteRevisions(knex, { grantId, organizationId, userId }, { cursor, limit });
}

async function getOrganizationNotesForGrant(
    knex,
    grantId,
    organizationId,
    { cursor, limit = 50 } = {},
) {
    return getCurrentNoteRevisions(knex, { grantId, organizationId }, { cursor, limit });
}

async function deleteGrantNotesByUser(knex, grantId, userId) {
    await knex
        .select('id')
        .from('grant_notes')
        .where({ grant_id: grantId, user_id: userId })
        .del();
}

module.exports = {
    saveNoteRevision,
    getCurrentNoteRevisions,
    getOrganizationNotesForGrant,
    getOrganizationNotesForGrantByUser,
    deleteGrantNotesByUser,
};
