# Advanced Search Filter Logic Implementation Guide

## Introduction
This guide provides a detailed description of the filter logic for the advanced search feature of our application. It will cover the implementation on both client-side and server-side (API) with the objective to ensure consistency, efficiency, and maintainability of our codebase.

## Overview of Advanced Search Feature
The advanced search feature allows users more granularity in the results they can generate when searching for appropriate grants. Our initial grants search included the ability to search via:

  - searchTerm
  - opportunity status
  - opportunity category
  - cost sharing

Our advanced search feature includes opportunity status, opportunity category, and cost sharing but also breaks up the concept of searchTerm into ***include*** and ***exclude*** terms. In total, all filters included in the advanced search feature are as follows:

  - include keywords
  - exclude keywords
  - opportunity #
  - opportunity status
  - opportunity category
  - cost sharing
  - eligibility
  - funding type
  - agency
  - posted within
  - review status

Our implementation should allow for a user to apply a single filter as well as multiple filters.

## Filter Logic

### Understanding Filter Logic
The filter logic is central to our search feature. It must be able to handle our updated fields at scale and should adhere to the same coding style as current our current implementation.

High level from client-side:

1. take user inputs through search side panel
2. dispatch action (to be written? or reuse existing?) with selected filters and their values
    - collate query and send GET to /api/organizations/:organizationId/grants?${query}

High level from server-side:

1. In routes/grants.js receive query through a new endpoint and validate user with requireUser.
    - replicate the functionality in the original endpoint '/'
2. Build new helper in server/src/db/helpers.js to handle include and exclude keywords.
    - use the existing helper function as a blueprint and write a new function
3. In db/grants.js write a new function similar to getGrants() to handle novel filters.

todo:
- write up endpoint specs for main search, multiselect fields
- write up frontend specs to connect to api

----
### Single or Multiple Filter Application

For our use case, we can handle the difference between single or multiple filters with the logical OR operator. On the client side, we'll send only filters that contain valid values and interpret the omitted or undefined values on the server side via ||, i.e. ```costSharing: req.query.costSharing || null```.

----
**Client-side Implementation**

Steps and code snippets on how to implement single filter logic on the client side.

----
**Server-side (API) Implementation**

For our implementation, we are going to write new endpoints and helper functions. The majority of the logic should be able to remain the same between the current and new implementations with the exceptions being updated/new fields and the separation of include and exclude keywords in place of searchTerm.

----
**Endpoint**

Current implementation in **server/src/routes/grants.js**:
```
router.get('/', requireUser, async (req, res) => {
    const { selectedAgency, user } = req.session;
    let agencyCriteria;
    // if we want interested, assigned, grants for a user, do not filter by eligibility or keywords
    if (!req.query.interestedByMe && !req.query.assignedToAgency) {
        agencyCriteria = await db.getAgencyCriteriaForAgency(selectedAgency);
    }

    const grants = await db.getGrants({
        ...req.query,
        tenantId: user.tenant_id,
        filters: {
            agencyCriteria,
            interestedByAgency: req.query.interestedByAgency ? selectedAgency : null,
            interestedByUser: req.query.interestedByMe ? req.signedCookies.userId : null,
            assignedToAgency: req.query.assignedToAgency ? req.query.assignedToAgency : null,
            positiveInterest: req.query.positiveInterest ? true : null,
            result: req.query.result ? true : null,
            rejected: req.query.rejected ? true : null,
            costSharing: req.query.costSharing || null,
            opportunityStatuses: parseCollectionQueryParam(req, 'opportunityStatuses'),
            opportunityCategories: parseCollectionQueryParam(req, 'opportunityCategories'),
        },
        orderBy: req.query.orderBy,
        orderDesc: req.query.orderDesc,
    });
    res.json(grants);
});
```
In the current implementation, parameters besides filters, orderBy, or orderDesc parameters are being spread via ...req.query. These can include currentPage, perPage, tenantId, and searchTerm.

The updated implementation needs to include the following fields in the query and be applied to the filters (note: italicized fields indicate a new or updated field):
  - *opportunity #*
  - opportunity status
  - opportunity category
  - cost sharing
  - *eligibility*
  - *funding type*
  - *agency*
  - *posted within*
  - *review status*

------
**Helper Function**

Along with the fields applied to the filters, we'll use a helper for the include and exclude keywords. A current example is in **server/src/db/helpers.js** under the function, whereAgencryCriteriaMatch. Below is the code snippet:

```
function whereAgencyCriteriaMatch(qb, criteria) {
    if (!criteria) {
        return;
    }
    if (criteria.eligibilityCodes) {
        qb.where('eligibility_codes', '~', criteria.eligibilityCodes.join('|'));
    }

    if (criteria.includeKeywords && criteria.includeKeywords.length > 0) {
        qb.where('description', '~*', criteria.includeKeywords.join('|'));
    }

    if (criteria.excludeKeywords && criteria.excludeKeywords.length > 0) {
        qb.where('description', '!~*', criteria.excludeKeywords.join('|'));
    }
}
```

For the purpose of reducing dependent code, we should build a separate helper housed in the same file but the logic should remain virtually identical to the above snippet.

----
**Model**

The current db model is found in **server/src/db/index.js** and the snippet is below:

```
async function getGrants({
    currentPage, perPage, tenantId, filters, orderBy, searchTerm, orderDesc,
} = {}) {
    const { data, pagination } = await knex(TABLES.grants)
        .select(`${TABLES.grants}.*`)
        .distinct()
        .modify((queryBuilder) => {
            if (searchTerm && searchTerm !== 'null') {
                queryBuilder.andWhere(
                    (qb) => qb.where(`${TABLES.grants}.grant_id`, '~*', searchTerm)
                        .orWhere(`${TABLES.grants}.grant_number`, '~*', searchTerm)
                        .orWhere(`${TABLES.grants}.title`, '~*', searchTerm),
                );
            }
            if (filters) {
                if (filters.interestedByUser || filters.positiveInterest || filters.result || filters.rejected || filters.interestedByAgency) {
                    queryBuilder.join(TABLES.grants_interested, `${TABLES.grants}.grant_id`, `${TABLES.grants_interested}.grant_id`)
                        .join(TABLES.interested_codes, `${TABLES.interested_codes}.id`, `${TABLES.grants_interested}.interested_code_id`);
                }
                if (filters.assignedToAgency) {
                    queryBuilder.join(TABLES.assigned_grants_agency, `${TABLES.grants}.grant_id`, `${TABLES.assigned_grants_agency}.grant_id`);
                }
                queryBuilder.andWhere(
                    (qb) => {
                        const isMyGrantsQuery = filters.interestedByAgency !== null
                                                || filters.assignedToAgency !== null
                                                || filters.rejected !== null
                                                || filters.result !== null;
                        if (!isMyGrantsQuery) {
                            helpers.whereAgencyCriteriaMatch(qb, filters.agencyCriteria);
                        }

                        if (filters.interestedByAgency != null) {
                            qb.where('grants_interested.agency_id', filters.interestedByAgency);
                        }
                        if (filters.interestedByUser) {
                            qb.where(`${TABLES.grants_interested}.user_id`, '=', filters.interestedByUser);
                        }
                        if (filters.assignedToAgency) {
                            qb.where(`${TABLES.assigned_grants_agency}.agency_id`, '=', filters.assignedToAgency);
                        }
                        if (!(filters.positiveInterest && filters.result && filters.rejected)) {
                            if (filters.positiveInterest) {
                                qb.where(`${TABLES.interested_codes}.status_code`, '=', 'Interested');
                            }
                            if (filters.result) {
                                qb.where(`${TABLES.interested_codes}.status_code`, '=', 'Result');
                            }
                            if (filters.rejected) {
                                qb.where(`${TABLES.interested_codes}.status_code`, '=', 'Rejected');
                            }
                        }
                        if (filters.opportunityStatuses?.length) {
                            qb.whereIn(`${TABLES.grants}.opportunity_status`, filters.opportunityStatuses);
                        }
                        if (filters.opportunityCategories?.length) {
                            qb.whereIn(`${TABLES.grants}.opportunity_category`, filters.opportunityCategories);
                        }
                        if (filters.costSharing) {
                            qb.where(`${TABLES.grants}.cost_sharing`, '=', filters.costSharing);
                        }
                    },
                );
            }
            if (orderBy && orderBy !== 'undefined') {
                if (orderBy.includes('interested_agencies')) {
                    queryBuilder.leftJoin(TABLES.grants_interested, `${TABLES.grants}.grant_id`, `${TABLES.grants_interested}.grant_id`);
                    const orderArgs = orderBy.split('|');
                    queryBuilder.orderBy(`${TABLES.grants_interested}.grant_id`, orderArgs[1]);
                    queryBuilder.orderBy(`${TABLES.grants}.grant_id`, orderArgs[1]);
                } else if (orderBy.includes('viewed_by')) {
                    const orderArgs = orderBy.split('|');
                    queryBuilder.leftJoin(TABLES.grants_viewed, `${TABLES.grants}.grant_id`, `${TABLES.grants_viewed}.grant_id`);
                    queryBuilder.orderBy(`${TABLES.grants_viewed}.grant_id`, orderArgs[1]);
                    queryBuilder.orderBy(`${TABLES.grants}.grant_id`, orderArgs[1]);
                } else {
                    const orderArgs = orderBy.split('|');
                    const orderDirection = ((orderDesc === 'true') ? 'desc' : 'asc');
                    if (orderArgs.length > 1) {
                        console.log(`Too many orderArgs: ${orderArgs}`);
                    }
                    queryBuilder.orderBy(orderArgs[0], orderDirection);
                }
            }
        })
        .paginate({ currentPage, perPage, isLengthAware: true });

    const viewedByQuery = knex(TABLES.agencies)
        .join(TABLES.grants_viewed, `${TABLES.agencies}.id`, '=', `${TABLES.grants_viewed}.agency_id`)
        .whereIn('grant_id', data.map((grant) => grant.grant_id))
        .andWhere('agencies.tenant_id', tenantId);

    const viewedBy = await viewedByQuery.select(`${TABLES.grants_viewed}.grant_id`, `${TABLES.grants_viewed}.agency_id`, `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`);
    const interestedBy = await getInterestedAgencies({ grantIds: data.map((grant) => grant.grant_id), tenantId });

    const dataWithAgency = data.map((grant) => {
        const viewedByAgencies = viewedBy.filter((viewed) => viewed.grant_id === grant.grant_id);
        const agenciesInterested = interestedBy.filter((interested) => interested.grant_id === grant.grant_id);
        return {
            ...grant,
            viewed_by_agencies: viewedByAgencies,
            interested_agencies: agenciesInterested,
        };
    });
    return { data: dataWithAgency, pagination };
}
```
Similar to the endpoint, we'll write a new model replicating the logic used in our current implementation with a few exceptions.

Under the .modify method, we'll first incorporate the include and exclude helper function we created above.

In the conditional ```if(filter)```, we'll add conditionals after the conditional ```if(filter.costSharing)``` to check if the following filters are included and run a qb.whereIn method on each one (*note: refer to the existing whereIn methods for opportunityStatuses, opportunityCatergories, and costSharing to maintain code consistency*):
  - *opportunity #*
  - *eligibility*
  - *funding type*
  - *agency*
  - *posted within*
  - *review status*

## Testing
Provide guidance on how to test each part of the filter logic to ensure it works correctly.

## Troubleshooting
Common issues that might arise during the implementation and how to solve them.