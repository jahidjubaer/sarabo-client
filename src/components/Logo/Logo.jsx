import { Link } from 'react-router';
import logoLockup from '../../assets/logo.png';
import logoMark from '../../assets/logo-mark.png';
import logoLockupOnInk from '../../assets/logo-on-ink.png';
import logoMarkOnInk from '../../assets/logo-mark-on-ink.png';

// Brand lockup (Phase 8.9/8.10; adaptive brand-lockup integration). Four
// transparent RGBA assets, one component - two axes:
//
//   showWordmark  true  -> the full horizontal lockup (symbol + the "SARABO"
//                          wordmark, which lives INSIDE the artwork now rather
//                          than being typeset beside it)
//                 false -> the symbol on its own, an exact pixel extraction of
//                          that same lockup. The collapsed dashboard rail is
//                          64px wide, where the 2.5:1 lockup cannot fit.
//
//   surface       'adaptive' -> the surface follows the theme (public navbar,
//                               auth form column): paper artwork on light,
//                               on-ink artwork on dark.
//                 'ink'      -> the surface is petrol ink in BOTH themes
//                               (footer, auth aside, dashboard sidebar, mobile
//                               dashboard nav), so it always takes the on-ink
//                               artwork.
//
// WHY TWO ARTWORK COLOURWAYS. The lockup's body colour is petrol #012035,
// which measures 1.02-1.11:1 against the ink surfaces - invisible. The on-ink
// variants recolour only that petrol family to --ds-ink-foreground #E8EDE9
// (verdigris and marigold accents, alpha and geometry are byte-identical), for
// 13.5-15.6:1 instead.
//
// WHY AN ARBITRARY VARIANT, NOT `dark:`. This project sets a `.dark` class on
// <html> (see theme/ThemeProvider.jsx) but never declares Tailwind v4's
// `@custom-variant dark`, so a bare `dark:` utility would compile to
// `@media (prefers-color-scheme: dark)` and follow the OS rather than the
// app's own theme control. `in-[.dark]:` targets the real class. The hidden
// variant is `display:none`, so it contributes no layout and no second width.
//
// Both images are deliberately alt="" (decorative): the wordmark is artwork,
// not text, and the Link already carries `ariaLabel`. Giving either image its
// own alt would announce the brand twice - or, on the adaptive surfaces, four
// times - on a single control.
const ASSETS = {
    paper: { lockup: logoLockup, mark: logoMark },
    ink: { lockup: logoLockupOnInk, mark: logoMarkOnInk },
};

const Logo = ({
    className = '',
    imgClassName = 'h-8',
    to = '/',
    ariaLabel = 'Sarabo home',
    showWordmark = true,
    surface = 'adaptive',
    onClick,
}) => {
    const key = showWordmark ? 'lockup' : 'mark';
    const imgBase = `${imgClassName} w-auto rounded-ds object-contain`;

    return (
        <Link to={to} aria-label={ariaLabel} onClick={onClick} className={`focus-ring inline-flex items-center rounded-ds ${className}`}>
            {surface === 'ink' ? (
                <img src={ASSETS.ink[key]} alt="" className={imgBase} />
            ) : (
                <>
                    <img src={ASSETS.paper[key]} alt="" className={`${imgBase} in-[.dark]:hidden`} />
                    <img src={ASSETS.ink[key]} alt="" className={`hidden ${imgBase} in-[.dark]:block`} />
                </>
            )}
        </Link>
    );
};

export default Logo;
