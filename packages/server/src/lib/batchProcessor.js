/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/**
 * BatchProcessor allows you to process any input stream in batches.
 * Fetch database records, APIs, or any other paginated data input stream
 * and process your data in batches instead of in one go.
 */
class BatchProcessor {
    /**
     * Pass a function to fetch data in a paginated manner using fetchRecordsFn.
     * You can set the page size and offset for fetching.
     * When runOnce is false, the batches will start over from the beginning at page 0 offset 0.
     * Optionally provide a context to be passed to fetchRecordsFn and processRecordsFn.
     * This is useful for passing database or http connections, etc.
     *
     * @param {{
     * fetchRecordsFn: function,
     * processRecordsFn: function,
     * pageSize: number,
     * offset: number,
     * sleepMs: number - Number of ms to sleep between fetch calls,
     * runOnce: boolean,
     * context: {Object}
     * }} configuration
     */
    constructor({
        fetchRecordsFn,
        processRecordsFn,
        pageSize = 10,
        offset = 0,
        sleepMs = 0,
        runOnce = true,
        context,
    }) {
        if (!fetchRecordsFn) {
            throw new Error('Must passed a function that fetches rercods');
        }
        if (!processRecordsFn) {
            throw new Error('Must passed a function that processes records');
        }
        this.fetchRecordsFn = fetchRecordsFn;
        this.processRecordsFn = processRecordsFn;
        this.pageSize = pageSize;
        this.offset = offset;
        this.sleep = sleepMs;
        this.runOnce = runOnce;
        this.stopped = true;
        this.currentPage = 0;
        // context passed to fetchRecordsFn and processRecordsFn function
        this.context = context;
    }

    processRecords(context, records) {
        return this.processRecordsFn(context, records);
    }

    _sleep() {
        return new Promise((resolve) => setTimeout(resolve, this.sleep));
    }

    async run() {
        while (!this.stopped) {
            const records = await this.fetchRecordsFn(this.context, this.pageSize, this.offset);
            if (records.length > 0) {
                await this.processRecords(this.context, records);
                this.offset = this.pageSize + this.pageSize * this.currentPage;
                this.currentPage += 1;
                if (this.sleep) {
                    await this._sleep(this.sleep);
                }
            } else {
                // If there are no records left we processed all of them
                this.offset = 0;
                this.currentPage = 0;
                if (this.runOnce) {
                    this.stop();
                }
            }
        }
    }

    /**
     * Start processing the batches.
     */
    start() {
        this.stopped = false;
        return this.run();
    }

    /**
     * Optionally stop the batches.
     * Note: If runOnce is true, batch processor will stop once it exhausts all data.
     * If runOnce is false, it is up to you to stop.
     */
    stop() {
        this.stopped = true;
        /*
            Setting stopped true will not stop the run() function immeadeatly since
            it could be in the middle of the while loop and a Promise excution.
            Resolving in the nextTick will mean that promises will be handled
            and run should exit the while loop
        */
        return new Promise((resolve) => {
            process.nextTick(resolve);
        });
    }
}

module.exports = BatchProcessor;
