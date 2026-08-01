// Only a same-origin path beginning with a single '/' is ever navigated to -
// rejects protocol-relative ('//host'), backslash tricks ('/\host', which
// some browsers normalize like '//host'), and anything not starting with
// '/' at all (which already excludes external URLs and javascript: URIs).
// actionUrl is server-generated copy today (see utils/notificationEvents.js
// on sarabo-server), but navigation must stay safe regardless.
function hasControlCharacter(path) {
    for (let i = 0; i < path.length; i += 1) {
        const code = path.charCodeAt(i);
        if (code <= 31) return true;
    }
    return false;
}

export function isSafeInternalPath(path) {
    if (typeof path !== 'string' || path.length === 0) return false;
    if (!path.startsWith('/')) return false;
    if (path.startsWith('//')) return false;
    if (path.includes('\\')) return false;
    if (hasControlCharacter(path)) return false;
    return true;
}
