import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { FaChevronDown } from 'react-icons/fa';
import Avatar from '../../../components/Avatar/Avatar';
import useClickOutside from '../../../hooks/useClickOutside';
import { ROLE_SHORTCUTS, ROLE_LABELS } from './roleShortcuts';

const menuLinkClass = 'focus-ring flex min-h-11 w-full items-center rounded-md px-3 py-2 text-sm hover:bg-base-200';

// Compact desktop-only avatar dropdown. Mobile handles the same actions
// inline in NavBar's drawer instead of nesting a dropdown inside a dropdown.
const ProfileDropdown = ({ user, role, roleLoading, isError, onLogout }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const triggerRef = useRef(null);

    const close = useCallback(() => setOpen(false), []);

    useClickOutside(containerRef, close, open);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    const displayName = user.displayName || user.email;
    // Role not yet resolved (or errored) - show common actions only, never a
    // guessed shortcut. See Phase L: no customer-as-default fallback.
    const roleKnown = !roleLoading && !isError;
    const shortcut = roleKnown ? ROLE_SHORTCUTS[role] : null;
    const roleLabel = roleKnown ? ROLE_LABELS[role] : null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(prev => !prev)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="profile-menu"
                aria-label={`Open profile menu for ${displayName}`}
                className="focus-ring flex min-h-11 items-center gap-2 rounded-full px-2 py-1 hover:bg-base-200"
            >
                <Avatar src={user.photoURL} name={displayName} size="w-9 h-9" />
                <span className="hidden text-sm font-medium xl:inline">{displayName}</span>
                <FaChevronDown aria-hidden="true" className={`text-xs opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    id="profile-menu"
                    role="menu"
                    aria-label="Profile menu"
                    className="absolute right-0 z-50 mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
                >
                    <div className="border-b border-base-300 px-3 py-2">
                        <p className="truncate font-semibold" title={displayName}>{displayName}</p>
                        <p className="truncate text-xs opacity-70" title={user.email}>{user.email}</p>
                        {roleLabel && <p className="mt-1 text-xs font-medium text-primary">{roleLabel}</p>}
                    </div>
                    <ul className="mt-2 flex flex-col gap-1">
                        <li>
                            <Link role="menuitem" to="/dashboard/profile" onClick={close} className={menuLinkClass}>
                                My Profile
                            </Link>
                        </li>
                        {shortcut && (
                            <li>
                                <Link role="menuitem" to={shortcut.to} onClick={close} className={menuLinkClass}>
                                    {shortcut.label}
                                </Link>
                            </li>
                        )}
                        <li>
                            <Link role="menuitem" to="/dashboard" onClick={close} className={menuLinkClass}>
                                Dashboard
                            </Link>
                        </li>
                        <li className="my-1 border-t border-base-300" role="separator"></li>
                        <li>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => { close(); onLogout(); }}
                                className={`${menuLinkClass} text-error`}
                            >
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
