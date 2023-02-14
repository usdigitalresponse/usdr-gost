const { TextEncoder, TextDecoder } = require('util');
const _ = require('lodash');

function normalizeEncoding(string) {
    if (string == null) { // null or undefined
        return null;
    }
    const utf8Encoder = new TextEncoder(); // only supports UTF-8
    const utf8Decoder = new TextDecoder('utf-8');
    return utf8Decoder.decode(utf8Encoder.encode(string));
}

function normalizeAndEscape(string) {
    if (string == null) { // null or undefined
        return null;
    }
    const trimmed = string.trim();
    const normalized = normalizeEncoding(trimmed);
    const escaped = _.escape(normalized);
    return escaped;
}

module.exports = {
    normalizeAndEscape,
};
