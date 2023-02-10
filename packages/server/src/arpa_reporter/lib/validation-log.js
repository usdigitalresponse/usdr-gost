const _ = require('lodash');
const ValidationItem = require('./validation-item');

class ValidationLog {
    constructor() {
        this.log = [];
    }

    append(toAppend) {
        if (toAppend) {
            if (_.isString(toAppend)) {
                this.log.push(new ValidationItem({ message: toAppend }));
            } else if (_.isArrayLike(toAppend)) {
                // assuming this is a list of validationItems
                this.log.push(...toAppend);
            } else if (toAppend instanceof ValidationLog) {
                this.log.push(...toAppend.log);
            } else {
                // assuming this is a single validationItem
                this.log.push(toAppend);
            }
        }
        return this;
    }

    getLog() {
        return this.log.map((item) => item.info);
    }

    success() {
        return this.log.length === 0;
    }
}

module.exports = { ValidationLog };

// NOTE: This file was copied from src/server/lib/validation-log.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
