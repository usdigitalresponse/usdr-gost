async function saveNoteRevision(knex, grantId, userId, text) {
    let grantNoteId;

    const grantNotesRevisionId = await knex.transaction(async (trx) => {
        const existingNote = await trx('grant_notes')
            .select(['id', 'is_published'])
            .where({ grant_id: grantId, user_id: userId })
            .first();

        if (existingNote) {
            grantNoteId = existingNote.id;

            if (!existingNote.is_published) {
                await trx('grant_notes')
                    .where({ id: grantNoteId })
                    .update({ is_published: true });
            }
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
            .insert({ grant_note_id: grantNoteId, text })
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
    const revQuery = knex
        .select(['rev.id', 'rev.grant_note_id', 'rev.created_at', 'rev.text'])
        .from({ rev: 'grant_notes_revisions' })
        .whereRaw('rev.grant_note_id = grant_notes.id')
        .orderBy('rev.created_at', 'desc')
        .limit(1);

    let query = knex('grant_notes')
        .select([
            'grant_notes.id',
            'grant_notes.created_at',
            'grant_notes.updated_at as updated_at',
            'grant_notes.grant_id',
            'rev.id as latest_revision_id',
            'rev.created_at as revised_at',
            'rev.text',
            'users.id as user_id',
            'users.name as user_name',
            'users.email as user_email',
            'users.avatar_color as user_avatar_color',
            'tenants.id as organization_id',
            'tenants.display_name as organization_name',
            'agencies.id as team_id',
            'agencies.name as team_name',
        ])
        .joinRaw(`LEFT JOIN LATERAL (${revQuery.toString()}) AS rev ON rev.grant_note_id = grant_notes.id`)
        .join('users', 'users.id', 'grant_notes.user_id')
        .join('agencies', 'agencies.id', 'users.agency_id')
        .join('tenants', 'tenants.id', 'users.tenant_id')
        .where('grant_notes.is_published', true);

    // Conditionally applying filters based on grantID if it is null or undefined or not
    if (grantId !== null && grantId !== undefined) {
        query = query.andWhere('grant_notes.grant_id', grantId);
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
            isRevised: note.revised_at > note.updated_at,
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
    await knex('grant_notes')
        .where({ grant_id: grantId, user_id: userId })
        .update({ is_published: false });
}

module.exports = {
    saveNoteRevision,
    getCurrentNoteRevisions,
    getOrganizationNotesForGrant,
    getOrganizationNotesForGrantByUser,
    deleteGrantNotesByUser,
};
