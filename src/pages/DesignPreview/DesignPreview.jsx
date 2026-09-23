import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Laptop, Plus, Smartphone, Tv, Wrench } from 'lucide-react';
import Logo from '../../components/Logo/Logo';
import { ThemeToggle } from '../../components/layout/ThemeToggle';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { MoneyInput } from '../../components/ui/money-input';
import { CheckboxField } from '../../components/ui/checkbox';
import { ChoiceCard } from '../../components/ui/choice-card';
import { Tabs, TabPanel } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { PageHeader } from '../../components/common/PageHeader';
import { Section } from '../../components/common/Section';
import { KpiStrip } from '../../components/common/KpiStrip';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FormField } from '../../components/common/FormField';
import { FormAlert } from '../../components/common/FormAlert';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingButton } from '../../components/common/LoadingButton';
import { AdminDataTable } from '../../components/admin/data-table/AdminDataTable';
import { STATUS_PRESENTATION } from '../../config/statusPresentation';
import { STATUS_DOMAINS, getStatusOptions } from '../../config/status';
import { notify } from '../../lib/notify';

// Development-only reference page for the redesign (Phase 1). It renders every
// token, primitive and pattern with sample values so the design system can be
// reviewed in both themes and at every width before pages adopt it. The route
// exists only in `vite dev` builds - see routes/router.jsx - and it calls no
// API: every value here is sample data.

const SWATCHES = [
    ['canvas', 'bg-ds-canvas'], ['card', 'bg-ds-card'], ['muted', 'bg-ds-muted'], ['accent', 'bg-ds-accent'],
    ['ink', 'bg-ds-ink'], ['primary', 'bg-ds-primary'], ['action', 'bg-ds-action'], ['destructive', 'bg-ds-destructive'],
];

const TYPE_ROLES = [
    ['text-display', 'Electronics repair'],
    ['text-title', 'Page title'],
    ['text-heading', 'Section heading'],
    ['text-subhead', 'Card title'],
    ['text-body', 'Body text reads at 16 on 1.6 for comfortable scanning.'],
    ['text-body-sm', 'Secondary text and table cells.'],
    ['text-micro', 'Updated 2 hours ago'],
];

const TABLE_ROWS = [
    { id: 'a', device: 'Walton 1.5 ton AC', district: 'Sylhet', status: 'pending-pickup', amount: 0 },
    { id: 'b', device: 'iPhone 12', district: 'Rajshahi', status: 'quote_submitted', amount: 3900 },
    { id: 'c', device: 'Sony Bravia 43"', district: 'Dhaka', status: 'repair_in_progress', amount: 5200 },
    { id: 'd', device: 'Dell Inspiron 15', district: 'Dhaka', status: 'repair_completed', amount: 4850 },
];

const TABLE_COLUMNS = [
    { id: 'device', header: 'Device', accessorKey: 'device', meta: { label: 'Device' } },
    { id: 'district', header: 'District', accessorKey: 'district', meta: { label: 'District' } },
    { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => <StatusBadge status={row.original.status} audience="admin" />, meta: { label: 'Status' } },
    { id: 'amount', header: 'Quote', accessorKey: 'amount', cell: ({ row }) => <span className="ds-numeric">{row.original.amount ? `৳${row.original.amount.toLocaleString('en-US')}` : '—'}</span>, meta: { label: 'Quote' } },
    { id: 'actions', header: '', enableSorting: false, cell: () => <Button variant="outline" size="sm">Open</Button>, meta: { label: 'Actions' } },
];

function Block({ title, children }) {
    return (
        <Section title={title} variant="card" contentClassName="space-y-4">
            {children}
        </Section>
    );
}

function DesignPreview() {
    const [tab, setTab] = useState('unassigned');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [device, setDevice] = useState('laptop');
    const [labour, setLabour] = useState('1,800');

    const confirm = () => {
        setBusy(true);
        setTimeout(() => {
            setBusy(false);
            setConfirmOpen(false);
            notify.success('Quote approved (sample).');
        }, 1200);
    };

    return (
        <div className="min-h-svh bg-ds-canvas text-ds-foreground">
            <header className="sticky top-0 z-30 border-b border-ds-border bg-ds-card/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-[80rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Logo to="/" />
                        <Badge tone="attention">Development only</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/" className="hidden text-body-sm font-semibold text-ds-primary sm:inline-flex sm:items-center sm:gap-1.5">
                            <ArrowLeft aria-hidden="true" className="size-4" />Back to site
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main id="main-content" tabIndex={-1} className="mx-auto max-w-[80rem] space-y-8 px-4 py-8 outline-none sm:px-6 lg:px-8">
                <PageHeader
                    title="Design system"
                    description="Redesign Phase 1 foundation: tokens, primitives and patterns. Sample data only; switch themes from the top right."
                    actions={<Button variant="action"><Plus aria-hidden="true" />One action per view</Button>}
                />

                <KpiStrip
                    label="Sample figures"
                    items={[
                        { label: 'New requests', value: 38 },
                        { label: 'Completed', value: 24 },
                        { label: 'Collected payments', value: '৳96,450', numeric: true },
                        { label: 'Payouts to process', value: '৳46,200', numeric: true },
                    ]}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                    <Block title="Surfaces and colour">
                        <div className="grid grid-cols-4 gap-3">
                            {SWATCHES.map(([name, className]) => (
                                <div key={name} className="space-y-1.5">
                                    <div className={`h-14 rounded-ds-lg border border-ds-border ${className}`} />
                                    <p className="text-micro font-semibold text-ds-muted-foreground">{name}</p>
                                </div>
                            ))}
                        </div>
                    </Block>

                    <Block title="Type roles">
                        <div className="space-y-3">
                            {TYPE_ROLES.map(([role, sample]) => (
                                <div key={role} className="flex items-baseline justify-between gap-4 border-b border-ds-border pb-2 last:border-0">
                                    <span className={`${role} min-w-0 truncate`}>{sample}</span>
                                    <code className="shrink-0 text-micro text-ds-muted-foreground">{role}</code>
                                </div>
                            ))}
                            <p className="ds-numeric text-body-sm">SRB-7Q4M2K · ৳4,850</p>
                        </div>
                    </Block>
                </div>

                <Block title="Buttons">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="action">Approve &amp; pay</Button>
                        <Button variant="primary">Save changes</Button>
                        <Button variant="outline">Decline</Button>
                        <Button variant="ghost">View history</Button>
                        <Button variant="destructive">Cancel request</Button>
                        <Button variant="destructiveGhost">Remove</Button>
                        <Button variant="link">Open full queue</Button>
                        <LoadingButton loading loadingText="Saving…">Save</LoadingButton>
                        <Button variant="outline" size="icon" aria-label="Add"><Plus aria-hidden="true" /></Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button size="sm" variant="outline">Small 36</Button>
                        <Button variant="outline">Default 44</Button>
                        <Button size="lg" variant="outline">Large 48</Button>
                    </div>
                </Block>

                <Block title="Status, by audience">
                    <p className="text-body-sm text-ds-muted-foreground">
                        Amber means the viewer has to act, so the same status can be amber for one role and quiet for another.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[40rem] text-body-sm">
                            <caption className="sr-only">Repair statuses shown to each role</caption>
                            <thead>
                                <tr className="text-left">
                                    <th scope="col" className="ds-label py-2 pr-4 text-ds-muted-foreground">Admin (neutral)</th>
                                    <th scope="col" className="ds-label py-2 pr-4 text-ds-muted-foreground">Customer</th>
                                    <th scope="col" className="ds-label py-2 text-ds-muted-foreground">Technician</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(STATUS_PRESENTATION).map((status) => (
                                    <tr key={status} className="border-t border-ds-border">
                                        <td className="py-2 pr-4"><StatusBadge status={status} audience="admin" /></td>
                                        <td className="py-2 pr-4"><StatusBadge status={status} audience="customer" /></td>
                                        <td className="py-2"><StatusBadge status={status} audience="technician" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="space-y-3 border-t border-ds-border pt-4">
                        {STATUS_DOMAINS.filter((domain) => domain !== 'repair').map((domain) => (
                            <div key={domain} className="flex flex-wrap items-center gap-2">
                                <span className="w-32 shrink-0 text-body-sm font-semibold">{domain}</span>
                                {getStatusOptions(domain).map((option) => (
                                    <StatusBadge key={option.value} domain={domain} status={option.value} audience="admin" />
                                ))}
                            </div>
                        ))}
                    </div>
                </Block>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Block title="Form controls">
                        <FormField id="dp-name" label="Full name" required hint="As it appears on your ID.">
                            <Input id="dp-name" placeholder="Nusrat Rahman" />
                        </FormField>
                        <FormField id="dp-district" label="District" required>
                            <Select id="dp-district" defaultValue="">
                                <option value="" disabled>Choose a district</option>
                                <option>Dhaka</option>
                                <option>Chattogram</option>
                                <option>Sylhet</option>
                            </Select>
                        </FormField>
                        <FormField id="dp-labour" label="Labour (BDT)" required>
                            <MoneyInput id="dp-labour" value={labour} onChange={(event) => setLabour(event.target.value)} />
                        </FormField>
                        <FormField id="dp-diagnosis" label="Diagnosis" required error="Write at least 10 characters.">
                            <Textarea id="dp-diagnosis" defaultValue="Screen" />
                        </FormField>
                        <CheckboxField label="Send me SMS updates" description="Only for this repair." defaultChecked />
                    </Block>

                    <Block title="Choice cards">
                        <fieldset>
                            <legend className="mb-3 text-body-sm font-semibold">What needs repairing?</legend>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[['smartphone', 'Smartphone', Smartphone], ['laptop', 'Laptop & computer', Laptop], ['tv', 'Television', Tv], ['other', 'Other electronics', Wrench]].map(([value, label, Icon]) => (
                                    <ChoiceCard
                                        key={value}
                                        name="dp-device"
                                        value={value}
                                        label={label}
                                        icon={Icon}
                                        checked={device === value}
                                        onChange={() => setDevice(value)}
                                    />
                                ))}
                            </div>
                        </fieldset>
                        <FormAlert alert={{ tone: 'danger', title: 'Login failed', text: 'That email and password do not match.' }} />
                        <FormAlert alert={{ tone: 'success', title: 'Check your inbox', text: 'A password reset link has been sent.' }} />
                    </Block>
                </div>

                <Block title="Tabs and data table">
                    <Tabs
                        idBase="dp-exceptions"
                        label="Exception type"
                        value={tab}
                        onValueChange={setTab}
                        items={[
                            { value: 'unassigned', label: 'Unassigned', count: 4 },
                            { value: 'withdrawals', label: 'Withdrawals', count: 2 },
                            { value: 'reports', label: 'Reports', count: 0 },
                        ]}
                    />
                    <TabPanel idBase="dp-exceptions" value="unassigned" active={tab === 'unassigned'}>
                        <AdminDataTable caption="Sample repair requests" columns={TABLE_COLUMNS} data={TABLE_ROWS} getRowId={(row) => row.id} pageSize={3} pageSizeOptions={[3, 10]} />
                    </TabPanel>
                    <TabPanel idBase="dp-exceptions" value="withdrawals" active={tab === 'withdrawals'}>
                        <EmptyState headingLevel={3} title="No withdrawals waiting" description="New requests from technicians appear here." />
                    </TabPanel>
                    <TabPanel idBase="dp-exceptions" value="reports" active={tab === 'reports'}>
                        <ErrorState headingLevel={3} description="Reports could not be loaded. This is a sample error." onRetry={() => notify.info('Retry (sample).')} />
                    </TabPanel>
                </Block>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Block title="Dialog and toasts">
                        <div className="flex flex-wrap gap-3">
                            <Button variant="action" onClick={() => setConfirmOpen(true)}>Approve &amp; pay ৳4,850</Button>
                            <Button variant="outline" onClick={() => notify.success('Saved.')}>Success toast</Button>
                            <Button variant="outline" onClick={() => notify.error('Could not save. Please try again.')}>Error toast</Button>
                        </div>
                        <ConfirmDialog
                            open={confirmOpen}
                            onOpenChange={setConfirmOpen}
                            title="Approve this quote?"
                            description="You'll go to secure card payment next. The repair starts once payment is confirmed."
                            summary={<div className="flex items-baseline justify-between"><span className="text-body-sm text-ds-muted-foreground">Total to pay</span><span className="ds-numeric text-heading">৳4,850</span></div>}
                            confirmVariant="action"
                            confirmLabel="Approve & continue"
                            cancelLabel="Not yet"
                            busy={busy}
                            busyLabel="Approving…"
                            onConfirm={confirm}
                        />
                    </Block>

                    <Block title="Loading">
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Card className="p-4"><Skeleton className="h-16 w-full" /></Card>
                        </div>
                    </Block>
                </div>
            </main>
        </div>
    );
}

export default DesignPreview;
