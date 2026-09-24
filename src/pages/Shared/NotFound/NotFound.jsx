import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { buttonVariants } from '../../../components/ui/button-variants';

// Any unknown public address (redesign Phase 6). Rendered inside the public
// layout, so the navigation and footer stay available.
function NotFound() {
    return (
        <section className="flex min-h-[60svh] items-center justify-center px-4 py-16 sm:px-6">
            <div className="max-w-md text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-ds-muted text-ds-foreground">
                    <Compass aria-hidden="true" className="size-7" />
                </span>
                <h1 id="page-title" tabIndex={-1} className="mt-5 text-title text-ds-foreground outline-none">Page not found</h1>
                <p className="mt-2 text-body text-ds-muted-foreground">The page you were looking for doesn't exist or has moved.</p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link to="/" className={buttonVariants({ variant: 'primary', size: 'lg' })}>Go to the homepage</Link>
                    <Link to="/track-request" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Track a repair</Link>
                </div>
            </div>
        </section>
    );
}

export default NotFound;
