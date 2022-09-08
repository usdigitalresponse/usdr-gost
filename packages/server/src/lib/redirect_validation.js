function validatePostLoginRedirectPath(url) {
    if (!url) {
        return null;
    }

    // Non-relative URLs could create an open redirect usable for phishing attacks.
    if (!url.startsWith('#') && !url.startsWith('/')) {
        return null;
    }

    // Redirects to API routes could allow users to be tricked into performing
    // unintended actions if they click a malicious link
    if (url.startsWith('/api')) {
        return null;
    }

    return url;
}

module.exports = { validatePostLoginRedirectPath };
