import { useEffect } from 'react';

// Closes a caller's menu/dropdown when a pointer event lands outside `ref`.
// Only attaches while `enabled` is true, and always cleans up - shared by
// NavBar's mobile drawer and ProfileDropdown so neither leaks a listener.
const useClickOutside = (ref, handler, enabled = true) => {
    useEffect(() => {
        if (!enabled) return;

        const listener = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                handler(event);
            }
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, enabled]);
};

export default useClickOutside;
