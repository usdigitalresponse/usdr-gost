async function run() {
    console.log('grants-digest-cron run() is called');

    /*
        The cron is responsible for:
        1. Identifying all unique criteria from grants_saved_searches
        2. Constructing a JSON object with the following for each criteria:
            {
                criteria: <criteria>,
                user_ids: [<user_id>, ...],
                email_date: <email_date>,
            }
        3. Publish each object created above as a new message in an SQS queue.
    */
}

module.exports = {
    run,
};
