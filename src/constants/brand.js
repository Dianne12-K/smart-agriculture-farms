/**
 * Product naming, in one place.
 *
 * The name used to be hard-coded as "Kakamega Farms" in four separate
 * components, which is how the UI ended up claiming a single-county scope for
 * a platform intended to serve Kenyan agriculture generally. Import from here
 * so the next rename is one edit rather than a grep.
 *
 * Note this is presentation only: some analytics are still numerically
 * calibrated to the Kakamega region (drought rainfall expectation, yield
 * ranges). Those are a real scope limit, not a label - see the backend's
 * REGION_* settings.
 */
export const APP_NAME = 'GeoQuad Smart Farm'

/** Compact form for tight spaces such as the mobile header. */
export const APP_NAME_SHORT = 'GeoQuad'

export const APP_TAGLINE = 'Satellite-powered farm intelligence'

/** Vendor, for footers and about screens. */
export const APP_VENDOR = 'GeoQuad Analytics Ltd.'
