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
Explain what filter logic is in the context of the advanced search feature, how it works, and its importance to the feature.

High level from client-side:

1. take user inputs through search side panel
2. dispatch action (to be written? or reuse existing?) with selected filters and their values
    - collate query and send GET to /api/organizations/:organizationId/grants?${query}

High level from server-side:

1. In routes/grants.js receive query through '/' or write new endpoint (in which case we need to update the client side endpoint) and validate user with requireUser.
    - separate out appropriate filters (see 'Look into this' below for some context) and call model function db.getGrants({ ...req.query, tenantId, filters, orderBy, orderDesc})
2. In db/grants.js update getGrants() to handle novel filters.

Look into this:
    // if we want interested, assigned, grants for a user, do not filter by eligibility or keywords
    if (!req.query.interestedByMe && !req.query.assignedToAgency) {
        agencyCriteria = await db.getAgencyCriteriaForAgency(selectedAgency);
    }

### Single Filter Application
Describe how to implement logic for a single filter, complete with code snippets and explanations.

Client-side Implementation
Steps and code snippets on how to implement single filter logic on the client side.

Server-side (API) Implementation
Steps and code snippets on how to implement single filter logic on the server side.

### Multiple Filter Application
Detail how to apply multiple filters at the same time, provide detailed code snippets, and explain how it differs from single filter application.

Client-side Implementation
Steps and code snippets on how to implement multiple filter logic on the client side.

Server-side (API) Implementation
Steps and code snippets on how to implement multiple filter logic on the server side.

### Handling Individual Term Changes
Detail how to handle changes to individual terms in a set of filter terms, complete with code snippets and explanations.

Client-side Implementation
Steps and code snippets on how to handle individual term changes on the client side.

Server-side (API) Implementation
Steps and code snippets on how to handle individual term changes on the server side.

## Testing
Provide guidance on how to test each part of the filter logic to ensure it works correctly.

## Troubleshooting
Common issues that might arise during the implementation and how to solve them.

## Conclusion
A summary and key points to remember for implementing the filter logic.