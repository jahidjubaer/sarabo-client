import { Link } from 'react-router';
import { ClipboardList } from 'lucide-react';
import { buttonVariants } from '../../components/ui/button-variants';
import { getRequestRepairAction } from '../../utils/publicContent';

// The page's single <h1> (Phase 7.9: migrated to ds-*/Lucide). No photographic
// asset exists for About - same designed CSS technical panel approach as
// Home's hero, no media. CTAs use the shared request action + real routes.
const AboutHero = () => {
    const requestAction = getRequestRepairAction();
    return (
        <section className="grid grid-cols-1 items-center gap-8 rounded-ds-lg border border-ds-border bg-ds-card p-6 sm:p-10 lg:grid-cols-2 lg:p-16">
            <div className="text-center lg:text-left">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ds-primary">About Sarabo</p>
                <h1 className="text-3xl font-bold tracking-tight text-ds-foreground sm:text-4xl lg:text-5xl">A structured platform for managing repair services</h1>
                <p className="mx-auto mt-4 max-w-xl text-base text-ds-muted-foreground sm:text-lg lg:mx-0">
                    Sarabo brings repair requests, technician assignment, progress tracking, payment records, and service completion into one managed workflow.
                </p>
                <p className="mx-auto mt-4 max-w-xl text-sm text-ds-muted-foreground lg:mx-0">
                    The platform is designed to help customers, technicians, and administrators work through a clearer and more accountable repair process.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                    <Link to={requestAction.to} className={buttonVariants({ variant: 'default' })}>{requestAction.label}</Link>
                    <Link to="/services" className={buttonVariants({ variant: 'outline' })}>Explore services</Link>
                </div>
            </div>
            <div
                className="tech-grid-pattern flex aspect-video w-full items-center justify-center rounded-ds-lg border border-on-dark/10 bg-surface-dark"
                aria-hidden="true"
            >
                <ClipboardList className="size-16 text-brand-accent/80" />
            </div>
        </section>
    );
};

export default AboutHero;
