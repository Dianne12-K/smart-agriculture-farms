/**
 * Turn an axios failure into something a user can act on.
 *
 * The API is on Render's free tier and sleeps after ~15 minutes idle, so the
 * single most common "error" is really just a cold start. Reporting that as
 * "Network Error" (or worse, as an empty list) sends people hunting for
 * missing data when all they had to do was wait.
 */
export function describeApiError(err) {
    if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message ?? '')) {
        return 'The server took too long to respond. It may be waking from sleep — try again in a moment.'
    }

    if (!err?.response) {
        return 'Could not reach the server. Check your connection, then try again.'
    }

    const { status, data } = err.response
    const detail = data?.message || data?.error

    switch (status) {
        case 400: return detail || 'The server rejected that request.'
        // Prefer the server's own wording: on a failed sign-in this is
        // "Incorrect email or password", not an expired session.
        case 401: return detail || 'Your session expired. Please sign in again.'
        case 403: return detail || 'You do not have access to this project.'
        case 404: return detail || 'That resource no longer exists.'
        case 409: return detail || 'That conflicts with something that already exists.'
        case 413: return detail || 'That file is too large to upload.'
        case 422: return detail || 'The server could not process that request.'
        case 503: return 'The server is not ready yet. Try again shortly.'
        default:
            if (status >= 500) {
                return detail || 'The server hit an error handling that request.'
            }
            return detail || `Request failed (${status}).`
    }
}

/**
 * True when the failure is worth offering a "Retry" button for, as opposed to
 * one the user has to resolve some other way (403, 404, bad input).
 */
export function isRetryable(err) {
    if (err?.code === 'ECONNABORTED') return true
    if (!err?.response) return true
    return err.response.status >= 500
}
