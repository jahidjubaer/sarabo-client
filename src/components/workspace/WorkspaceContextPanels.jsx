import { Card, CardContent } from '../ui/card';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import { formatMoneyRange, formatMoney } from '../../utils/currency';
import { formatCurrency } from '../../utils/formatCurrency';
import { isLegacyRequest } from '../../utils/workspacePresentation';

// Compact, role-safe context panels for the workspace sidebar (Phase 7.6).
// Never renders raw object dumps, ids, schemaVersion, or storage internals.
// Money keeps its own stored currency (no FX, no combined totals): a v2 request
// shows its BDT pricing estimate, a legacy request its historical USD cost.

function Row({ label, value }) {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="flex justify-between gap-3 py-1 text-sm">
            <dt className="shrink-0 text-ds-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words text-right text-ds-foreground">{value}</dd>
        </div>
    );
}

function Panel({ title, children }) {
    return (
        <Card>
            <CardContent className="p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ds-muted-foreground">{title}</h3>
                <dl className="divide-y divide-ds-border">{children}</dl>
            </CardContent>
        </Card>
    );
}

function formatEstimate(request) {
    const pricing = request?.pricing;
    if (pricing && typeof pricing.estimateMin === 'number' && typeof pricing.estimateMax === 'number') {
        const range = formatMoneyRange(pricing.estimateMin, pricing.estimateMax, pricing.currency);
        return range ? `${range} (estimate)` : null;
    }
    return null;
}

function WorkspaceContextPanels({ request, showCustomer }) {
    const legacy = isLegacyRequest(request);
    const estimate = !legacy ? formatEstimate(request) : (Number.isFinite(Number(request?.cost)) ? formatCurrency(request.cost) : null);
    const approvedQuote = request?.quote && request.quote.status === 'approved' && Number.isFinite(Number(request.quote.totalAmount))
        ? formatMoney(request.quote.totalAmount, request.quote.currency)
        : null;

    return (
        <div className="space-y-4">
            <Panel title="Device">
                {legacy ? (
                    <>
                        <Row label="Device" value={request.deviceName} />
                    </>
                ) : (
                    <>
                        <Row label="Category" value={request.product?.categorySlug ? humanizeSlug(request.product.categorySlug) : null} />
                        <Row label="Brand" value={request.product?.brand} />
                        <Row label="Model" value={request.product?.model} />
                        <Row label="Problem" value={request.damage?.description} />
                    </>
                )}
            </Panel>

            <Panel title="Service">
                {legacy ? (
                    <Row label="Address" value={[request.senderAddress, request.senderDistrict, request.senderRegion].filter(Boolean).join(', ') || null} />
                ) : (
                    <Row label="Location" value={[request.serviceLocation?.district, request.serviceLocation?.region].filter(Boolean).join(', ') || null} />
                )}
                <Row label="Technician" value={request.technicianName} />
            </Panel>

            {showCustomer && (
                <Panel title="Customer">
                    <Row label="Name" value={request.senderName} />
                    <Row label="Email" value={request.senderEmail} />
                    {legacy && <Row label="Phone" value={request.senderPhone} />}
                </Panel>
            )}

            <Panel title="Financial">
                {estimate && <Row label={legacy ? 'Cost' : 'Estimate'} value={estimate} />}
                {approvedQuote && <Row label="Approved quote" value={approvedQuote} />}
                <Row label="Payment" value={request.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'} />
            </Panel>
        </div>
    );
}

export { WorkspaceContextPanels };
