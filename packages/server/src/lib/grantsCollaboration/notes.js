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

async function getOrganizationNotesForGrantByUser(
    knex,
    organizationId,
    userId,
    grantId,
    { afterRevision, limit = 50 } = {}
) {
    return getCurrentNoteRevisions(knex, { grantId, userId }, { afterRevision, limit });
}

async function getCurrentNoteRevisions(
    knex,
    { grantId, organizationId, userId } = {}, 
    { afterRevision, limit = 50 } = {}
) {
    const subquery = knex.select([
        'r.id',
        'r.grant_note_id',
        'r.created_at',
        'r.text',
    ])
        .from({ r: 'grant_notes_revisions' })
        .whereRaw('r.grant_note_id = grant_notes.id')
        .orderBy('r.created_at', 'desc')
        .limit(1)
        .as('rev');

    let query = knex('grant_notes')
        .select([
            'grant_notes.id',
            'grant_notes.created_at',
            'grant_notes.grant_id',
            'rev.id as latest_revision_id',
            'rev.created_at as revised_at',
            'rev.text',
            'users.id as user_id',
            'users.name as user_name',
            'users.email as user_email',
            'tenants.id as organization_id',
            'tenants.display_name as organization_name',
            'agencies.id as team_id',
            'agencies.name as team_name',
        ])
        .joinRaw(`LEFT JOIN LATERAL (${subquery.toQuery()}) AS rev ON rev.grant_note_id = grant_notes.id`)
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
            query = query.andWhere('grant_notes.user_id', userId)
        }

    if (afterRevision) {
        query = query.andWhere('rev.id', '>', afterRevision);
    }

    const notes = await query
        .orderBy('rev.created_at', 'desc')
        .limit(limit);
    return {
        notes: notes.map((note) => ({
            id: note.latest_revision_id,
            createdAt: note.revised_at,
            text: note.text,
            grant: { id: note.grant_id },
            user: {
                id: note.user_id,
                name: note.user_name,
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
            from: notes.length > 0 ? notes[notes.length - 1].latest_revision_id : afterRevision,
        },
    };
}

async function getOrganizationNotesForGrant(
    knex, 
    grantId, 
    organizationId, 
    { afterRevision, limit = 50 } = {}
) {
    return getCurrentNoteRevisions(knex, { grantId, organizationId }, { afterRevision, limit });
}

module.exports = { saveNoteRevision, getCurrentNoteRevisions, getOrganizationNotesForGrant, getOrganizationNotesForGrantByUser };
