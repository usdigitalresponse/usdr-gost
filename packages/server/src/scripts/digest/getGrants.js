function main() {
    console.log('getGrants.js.main() is called');
    /*
        The getGrants.js script is responsible for:
        1. Receiving messages from an SQS queue
        2. Parse the message body into an object with the following shape:
            {
                criteria: <criteria>,
                user_ids: [<user_id>, ...],
                email_date: <email_date>,
            }
        3. For each object, query the grants table for grants that match the criteria
        4. For each user in user_ids, create a JSON object with the following shape:
            {
                user_id: <user_id>,
                grant_ids: [<grant_id>, ...],
                email_date: <email_date>,
            }
        5. Publish each object created above as a new message in an SQS queue.
    */
}

if (require.main === module) {
    main().then(() => process.exit());
}
