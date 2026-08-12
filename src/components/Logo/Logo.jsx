import { Link } from 'react-router';
import logoAsset from '../../assets/logo.png';

// Brand lockup (Phase 8.9/8.10): the approved Sarabo logo asset
// (src/assets/logo.png) is the icon-only shield "S" mark; the "SARABO" wordmark
// is rendered as text beside it. The image is drawn at a fixed height with
// width:auto + object-contain so it never distorts. One component is reused
// across the navbar, auth layout, footer, and dashboard shell. Props keep it
// reusable without duplicating the asset import:
//   - `to` / `ariaLabel`: link destination + label (dashboard links to
//     /dashboard, public surfaces to /).
//   - `showWordmark`: hide the text wordmark for the collapsed dashboard rail.
//   - `onClick`: e.g. close the mobile drawer on navigation.
const Logo = ({ className = '', imgClassName = 'h-8', to = '/', ariaLabel = 'Sarabo home', showWordmark = true, onClick }) => (
    <Link to={to} aria-label={ariaLabel} onClick={onClick} className={`focus-ring inline-flex items-center rounded-ds ${className}`}>
        <img
            src={logoAsset}
            alt="Sarabo"
            className={`${imgClassName} w-auto rounded-ds object-contain`}
        />
        {showWordmark && <span className="ml-2 text-lg font-bold">SARABO</span>}
    </Link>
);

export default Logo;
