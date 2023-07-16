# Advanced Search Filter Logic Implementation Guide

## Introduction
This guide provides a detailed description of the filter logic for the advanced search feature of our application. It will cover the implementation on both client-side and server-side (API) with the objective to ensure consistency, efficiency, and maintainability of our codebase.

## Overview of Advanced Search Feature
The advanced search feature allows users more granularity in the results they can generate when searching for appropriate grants. Our initial grants search included the ability to search via:

  - searchTerm
  - opportunity status
  - opportunity category
  - cost sharing

Our advanced search feature includes opportunity status, opportunity category, and cost sharing but also breaks up the concept of searchTerm into ***include*** and ***exclude*** terms. It also introduces:

  - include keywords
  - exclude keywords
  - opportunity #
  - eligibility
  - funding type
  - agency
  - posted within
  - review status

Our implementation should allow for a user to apply a single filter as well as multiple filters.

## Filter Logic
Understanding Filter Logic
Explain what filter logic is in the context of the advanced search feature, how it works, and its importance to the feature.

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