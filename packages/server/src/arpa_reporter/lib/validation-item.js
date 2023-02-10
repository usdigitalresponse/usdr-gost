class ValidationItem {
    constructor({
        message, severity = 1, tab = null, row = null, col = null,
    }) {
        this.info = {
            message, severity, tab, row, col,
        };
    }
}

module.exports = { ValidationItem };
