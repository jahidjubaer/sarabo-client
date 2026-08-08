import { ShieldX } from 'lucide-react';
import { Link } from 'react-router';
import { buttonVariants } from '../ui/button-variants';

// Access-denied screen (Phase 7.9: redesigned to ds-*/Lucide, replacing the
// Lottie animation - which was this app's only Lottie usage, so react-lottie
// and its lottie-web eval-warning dependency are dropped). Reached by the role
// guards and RoleError; routing/authorization behavior is unchanged.
const Forbidden = () => (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-ds-destructive/10 text-ds-destructive">
            <ShieldX aria-hidden="true" className="size-10" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-ds-foreground sm:text-3xl">You don’t have access to this page</h1>
        <p className="mt-2 max-w-md text-sm text-ds-muted-foreground">
            Please contact the administrator if you believe this is an error.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/" className={buttonVariants({ variant: 'default' })}>Go to home</Link>
            <Link to="/dashboard" className={buttonVariants({ variant: 'outline' })}>Go to dashboard</Link>
        </div>
    </div>
);

export default Forbidden;
