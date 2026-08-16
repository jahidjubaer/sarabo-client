import { Link } from "react-router";
import { ErrorState } from "../common/ErrorState";
import { buttonVariants } from "../ui/button-variants";

// Shown when a route guard's role lookup fails (network/server error) - kept
// distinct from Forbidden, which means "authenticated but wrong role."
//
// Phase 7.1 proof-of-foundation: this small, non-business-critical surface is
// migrated to the new design system (ErrorState + Button tokens) to prove the
// primitives compile and render. No behaviour changes - it still offers a
// retry (reload) and a link home; only the presentation now comes from the
// shared foundation instead of ad-hoc DaisyUI/raw-colour markup.
const RoleError = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <ErrorState
                title="We couldn't confirm your account access right now."
                description="Please refresh the page or try again shortly."
                onRetry={() => window.location.reload()}
                retryLabel="Refresh"
                headingLevel={1}
                secondaryAction={
                    <Link to="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Go to Home
                    </Link>
                }
            />
        </div>
    );
};

export default RoleError;
