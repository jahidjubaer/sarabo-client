import { Link } from 'react-router';
import logoAsset from '../../assets/logo.png';

// Brand lockup (Phase 8.9): the approved Sarabo logo asset
// (src/assets/logo.png) - a shield "S" mark above the "Sarabo" wordmark. The
// image already contains the wordmark, so no separate text is rendered. It is
// drawn at a fixed height with width:auto + object-contain so it never
// distorts, and the one component is reused in the navbar, auth layout, and
// footer. `imgClassName` lets a consumer scale it (e.g. a larger auth-screen
// lockup) without duplicating the asset import.
const Logo = ({ className = '', imgClassName = 'h-8' }) => (
    <Link to="/" aria-label="Sarabo home" className={`focus-ring inline-flex items-center rounded-ds ${className}`}>
        <img
            src={logoAsset}
            alt="Sarabo"
            className={`${imgClassName} w-auto rounded-ds object-contain`}
        />
        <span className="ml-2 font-bold text-lg ">SARABO</span>
    </Link>
);

export default Logo;
