import { useEffect } from 'react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { Compass, RefreshCw, TriangleAlert } from 'lucide-react';
import Logo from '../../../components/Logo/Logo';
import { Button } from '../../../components/ui/button';
import { buttonVariants } from '../../../components/ui/button-variants';

// A page that was deployed after this tab loaded can no longer be fetched:
// its old chunk file is gone. Browsers word this differently.
function isStaleChunkError(error) {
    const message = String(error?.message || error || '');
    return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch/i.test(message);
}

// A full-page message with one clear way forward.
function ErrorScreen({ icon, title, description, children }) {
    const ScreenIcon = icon;
    useEffect(() => { document.title = `${title} · Sarabo`; }, [title]);
    return (
        <div className="flex min-h-svh flex-col bg-ds-background px-4 py-6 text-ds-foreground sm:px-6">
            <div className="mx-auto w-full max-w-6xl"><Logo to="/" /></div>
            <main id="main-content" className="flex flex-1 items-center justify-center py-12">
                <div className="max-w-md text-center">
                    <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-ds-muted text-ds-foreground">
                        <ScreenIcon aria-hidden="true" className="size-7" />
                    </span>
                    <h1 className="mt-5 text-title text-ds-foreground">{title}</h1>
                    <p className="mt-2 text-body text-ds-muted-foreground">{description}</p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">{children}</div>
                </div>
            </main>
        </div>
    );
}

// The router's error element (redesign Phase 6). Before this, any routing or
// render error showed React Router's built-in developer screen.
//   - a stale page chunk after a deploy -> ask for a reload
//   - a 404 response                   -> page not found
//   - anything else                    -> something went wrong
function RouteError() {
    const error = useRouteError();
    if (import.meta.env.DEV) console.error('Route error:', error);

    if (isStaleChunkError(error)) {
        return (
            <ErrorScreen icon={RefreshCw} title="Sarabo has been updated" description="This page changed since you opened Sarabo. Reload to get the latest version.">
                <Button variant="action" size="lg" onClick={() => window.location.reload()}>Reload</Button>
            </ErrorScreen>
        );
    }
    if (isRouteErrorResponse(error) && error.status === 404) {
        return (
            <ErrorScreen icon={Compass} title="Page not found" description="The page you were looking for doesn't exist or has moved.">
                <Link to="/" className={buttonVariants({ variant: 'primary', size: 'lg' })}>Go to the homepage</Link>
                <Link to="/track-request" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Track a repair</Link>
            </ErrorScreen>
        );
    }
    return (
        <ErrorScreen icon={TriangleAlert} title="Something went wrong" description="Sarabo hit a problem showing this page. Reloading usually fixes it.">
            <Button variant="primary" size="lg" onClick={() => window.location.reload()}>Reload</Button>
            <Link to="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Go to the homepage</Link>
        </ErrorScreen>
    );
}

export default RouteError;
