// Maps Firebase Auth error codes to safe, user-facing messages. Never surface
// error.message, error.code, or any backend detail directly to the user.
const AUTH_ERROR_MESSAGES = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'Invalid email or password.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
};

export function getAuthErrorMessage(error) {
    const code = error?.code;
    if (code && AUTH_ERROR_MESSAGES[code]) {
        return AUTH_ERROR_MESSAGES[code];
    }
    return 'Something went wrong. Please try again.';
}

export function getSyncErrorMessage() {
    return 'We could not finish setting up your account on our server. Please try again.';
}
