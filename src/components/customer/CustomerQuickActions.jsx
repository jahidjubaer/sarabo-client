import { Link } from 'react-router';
import { PlusCircle, Wrench, CreditCard } from 'lucide-react';
import { Card } from '../ui/card';

// Small set of REAL customer destinations (every `to` is an existing route).
// No placeholder or decorative actions.
const QUICK_ACTIONS = [
    { label: 'New Repair Request', description: 'Start a new device repair', to: '/dashboard/create-request', icon: PlusCircle },
    { label: 'My Requests', description: 'View all your repairs', to: '/dashboard/my-requests', icon: Wrench },
    { label: 'Payment History', description: 'Review past payments', to: '/dashboard/payment-history', icon: CreditCard },
];

function CustomerQuickActions() {
    return (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                    <Link key={action.to} to={action.to} className="focus-ring rounded-ds-lg">
                        <Card className="h-full transition-colors hover:border-ds-primary/40 hover:bg-ds-muted/40">
                            <div className="flex items-start gap-3 p-4">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-ds bg-ds-primary/10 text-ds-primary">
                                    <Icon aria-hidden="true" className="size-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-ds-foreground">{action.label}</p>
                                    <p className="text-xs text-ds-muted-foreground">{action.description}</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}

export { CustomerQuickActions };
