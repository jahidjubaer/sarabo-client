import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { FaBars, FaTimes } from 'react-icons/fa';
import Logo from '../../../components/Logo/Logo';
import Avatar from '../../../components/Avatar/Avatar';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import useClickOutside from '../../../hooks/useClickOutside';
import ProfileDropdown from './ProfileDropdown';
import { ROLE_SHORTCUTS } from './roleShortcuts';

// Active state is shown via colour + weight + a bottom indicator together
// (not colour alone), consistently on desktop and mobile.
const navLinkClass = ({ isActive }) =>
    `focus-ring block rounded-md border-b-2 px-1 py-2 text-sm font-medium transition-colors lg:py-1 ${isActive
        ? 'border-primary text-primary font-semibold'
        : 'border-transparent text-base-content/80 hover:text-primary'
    }`;

const mobileActionClass = 'focus-ring flex min-h-11 w-full items-center rounded-md px-3 py-2 text-sm hover:bg-base-200';

const NavBar = () => {
    const { user, logOut } = useAuth();
    const { role, roleLoading, isError } = useRole();
    const location = useLocation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const mobileNavRef = useRef(null);
    const mobileTriggerRef = useRef(null);

    // Memoized so useClickOutside's effect doesn't tear down and re-attach
    // its document listener on every render while the menu is open.
    const closeMobile = useCallback(() => setMobileOpen(false), []);

    useClickOutside(mobileNavRef, closeMobile, mobileOpen);

    // Closing on every route change is a safety net beyond per-link onClick -
    // it also covers the Logo (outside this ref) and browser back/forward.
    // Adjusted during render (React's sanctioned pattern for resetting state
    // on prop/derived-value change) rather than in an effect, so it never
    // triggers a synchronous setState-in-effect cascade.
    const [prevPathname, setPrevPathname] = useState(location.pathname);
    if (location.pathname !== prevPathname) {
        setPrevPathname(location.pathname);
        if (mobileOpen) setMobileOpen(false);
    }

    useEffect(() => {
        if (!mobileOpen) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setMobileOpen(false);
                mobileTriggerRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [mobileOpen]);

    const handleLogOut = () => {
        logOut()
            .catch(error => {
                // Mirrors AuthProvider's own dev-only diagnostic pattern - no
                // user-facing toast, no ungated console noise in production.
                if (import.meta.env.DEV) console.error('Logout failed:', error.message);
            });
    };

    const roleKnown = !roleLoading && !isError;
    const mobileShortcut = roleKnown ? ROLE_SHORTCUTS[role] : null;

    const publicLinks = (
        <>
            <li><NavLink end to="/" className={navLinkClass} onClick={closeMobile}>Home</NavLink></li>
            <li><NavLink to="/services" className={navLinkClass} onClick={closeMobile}>Services</NavLink></li>
            <li><NavLink to="/service-areas" className={navLinkClass} onClick={closeMobile}>Service Areas</NavLink></li>
            <li><NavLink to="/track-request" className={navLinkClass} onClick={closeMobile}>Track Repair</NavLink></li>
            <li><NavLink to="/about" className={navLinkClass} onClick={closeMobile}>About</NavLink></li>
            {/* Public before login (preserves existing anonymous behavior); once
            signed in, customer-only - `role` is undefined for anonymous visitors,
            while useRole is loading, and on a role-fetch error, so this never
            flashes for admin/technician or briefly shows before it should. */}
            {
                (!user || role === 'user') &&
                <li><NavLink to="/dashboard/create-request" className={navLinkClass} onClick={closeMobile}>Create Repair Request</NavLink></li>
            }
            <li><NavLink to="/become-technician" className={navLinkClass} onClick={closeMobile}>Become a Technician</NavLink></li>
        </>
    );

    return (
        <div className="sticky top-0 z-50 navbar bg-base-100 border-b border-base-300 px-4 sm:px-6 lg:px-8">
            <div className="navbar-start gap-2">
                <button
                    ref={mobileTriggerRef}
                    type="button"
                    onClick={() => setMobileOpen(prev => !prev)}
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-nav-panel"
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    className="focus-ring btn btn-ghost min-h-11 lg:hidden"
                >
                    {mobileOpen ? <FaTimes className="h-5 w-5" aria-hidden="true" /> : <FaBars className="h-5 w-5" aria-hidden="true" />}
                </button>
                <span className="btn btn-ghost text-xl">
                    <Logo></Logo>
                </span>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal items-center gap-1 px-1">
                    {publicLinks}
                </ul>
            </div>

            <div className="navbar-end gap-2">
                {/* Reserved layout position - a future NotificationBell mounts
                here beside the avatar. No bell/badge/count renders yet. */}
                <div className="navbar-actions hidden lg:flex lg:items-center lg:gap-2">
                    {
                        user
                            ? <ProfileDropdown user={user} role={role} roleLoading={roleLoading} isError={isError} onLogout={handleLogOut} />
                            : <>
                                <Link className="btn btn-outline" to="/login">Log in</Link>
                                <Link className="btn btn-primary" to="/register">Register</Link>
                            </>
                    }
                </div>
            </div>

            {mobileOpen && (
                <div
                    ref={mobileNavRef}
                    id="mobile-nav-panel"
                    className="absolute left-0 right-0 top-full z-50 border-b border-base-300 bg-base-100 shadow-lg lg:hidden"
                >
                    <ul className="menu w-full gap-1 p-4">
                        {publicLinks}
                    </ul>
                    <div className="border-t border-base-300 p-4">
                        {
                            user
                                ? <>
                                    <div className="mb-3 flex items-center gap-3">
                                        <Avatar src={user.photoURL} name={user.displayName || user.email} size="w-10 h-10" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold" title={user.displayName || user.email}>
                                                {user.displayName || user.email}
                                            </p>
                                            <p className="truncate text-xs opacity-70" title={user.email}>{user.email}</p>
                                        </div>
                                    </div>
                                    <ul className="flex flex-col gap-1">
                                        <li><Link to="/dashboard/profile" className={mobileActionClass} onClick={closeMobile}>My Profile</Link></li>
                                        {mobileShortcut && <li><Link to={mobileShortcut.to} className={mobileActionClass} onClick={closeMobile}>{mobileShortcut.label}</Link></li>}
                                        <li><Link to="/dashboard" className={mobileActionClass} onClick={closeMobile}>Dashboard</Link></li>
                                        <li>
                                            <button type="button" onClick={() => { closeMobile(); handleLogOut(); }} className={`${mobileActionClass} text-error`}>
                                                Logout
                                            </button>
                                        </li>
                                    </ul>
                                </>
                                : <div className="flex flex-col gap-2">
                                    <Link to="/login" className="btn btn-outline w-full" onClick={closeMobile}>Log in</Link>
                                    <Link to="/register" className="btn btn-primary w-full" onClick={closeMobile}>Register</Link>
                                </div>
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavBar;
