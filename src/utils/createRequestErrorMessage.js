// v2-specific server error codes (Phase 6.4 Unit 3A) - audited directly
// against sarabo-server's utils/repairRequestV2.js, controllers/
// parcelController.js#createRepairRequestV2, and middleware/auth.js, not
// guessed. Notably: the real auth-failure code is AUTHENTICATION_REQUIRED
// (not UNAUTHORIZED), the real product/service mismatch code is
// SERVICE_PRODUCT_MISMATCH (not REQUEST_SERVICE_MISMATCH), and a
// database-not-ready response (middleware/database.js) carries no `code`
// field at all - only a bare 503 - so it is handled by the status-based
// fallback below, never a code lookup.
const V2_ERROR_MESSAGES = {
    UNSUPPORTED_REPAIR_REQUEST_SCHEMA_VERSION: 'Something went wrong preparing your request. Please refresh and try again.',
    CLIENT_PRICING_NOT_ALLOWED: 'Something went wrong preparing your request. Please refresh and try again.',
    INVALID_PRODUCT_CATEGORY: 'Please select a valid product category.',
    PRODUCT_BRAND_REQUIRED: 'Brand is required for this product category.',
    PRODUCT_MODEL_REQUIRED: 'Model is required for this product category.',
    INVALID_PRODUCT_BRAND: 'Please enter a valid brand.',
    INVALID_PRODUCT_MODEL: 'Please enter a valid model.',
    INVALID_SERIAL_NUMBER: 'Please enter a valid serial number.',
    INVALID_SERVICE_DEFINITION_ID: 'Please select a repair service.',
    SERVICE_DEFINITION_NOT_FOUND: 'That repair service is no longer available. Please choose another.',
    SERVICE_NOT_ACTIVE: 'That repair service is no longer available. Please choose another.',
    SERVICE_PRODUCT_MISMATCH: 'Please re-select a repair service for this product category.',
    DAMAGE_DESCRIPTION_REQUIRED: 'Please describe the issue with your device.',
    INVALID_DAMAGE_DESCRIPTION: 'Please describe the issue in more detail.',
    INVALID_SERVICE_LOCATION: 'Please complete the service location fields.',
    AUTHENTICATION_REQUIRED: 'Your session has expired. Please log in again.',
    FORBIDDEN: 'You are not authorized to create a repair request.',
};

// Maps a Create Repair Request API error to a safe, user-facing message.
// Never surface the raw server, MongoDB, Axios, or Firebase error. Checks
// the v2 controlled error code first (present on every 400 from
// createRepairRequestV2), then falls back to the original status-based
// mapping - which also still serves the legacy (schemaVersion-less)
// creation path unchanged.
export function getCreateRequestErrorMessage(error) {
    const code = error?.response?.data?.code;
    if (code && V2_ERROR_MESSAGES[code]) {
        return V2_ERROR_MESSAGES[code];
    }

    const status = error?.response?.status;
    if (!status) {
        return 'Network error. Please check your connection and try again.';
    }
    switch (status) {
        case 400:
            return 'Some of the details you entered could not be accepted. Please review the form and try again.';
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            return 'You are not authorized to create a repair request.';
        case 503:
            return 'Service temporarily unavailable. Please try again shortly.';
        default:
            return 'Something went wrong creating your repair request. Please try again.';
    }
}
