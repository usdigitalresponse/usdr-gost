// This function ensures that URLs passed to the "redirect_to" argument during
// the login flow are valid and safe to redirect to. Returns null if the argument
// should be discarded (and redirect to default page); if argument is valid, the
// redirect URL is returned. In the future, this function could also transform
// the URL if needed.
function validatePostLoginRedirectPath(url) {
    if (!url) {
        return null;
    }

    // Non-relative URLs could create an open redirect usable for phishing attacks.
    if (!url.startsWith('/')) {
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
