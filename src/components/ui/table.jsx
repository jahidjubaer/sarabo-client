import { cn } from '../../lib/utils';

// Styled table primitives. Table wraps itself in an overflow-x container so a
// wide table scrolls inside its own box on small screens instead of forcing
// the whole page to scroll horizontally (a hard rule for the responsive
// foundation). Higher-level loading/empty handling lives in
// components/common/DataTable.jsx, which composes these.
function Table({ className, ...props }) {
    return (
        <div className="relative w-full overflow-x-auto">
            <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
        </div>
    );
}

function TableHeader({ className, ...props }) {
    return <thead className={cn("[&_tr]:border-b [&_tr]:border-ds-border", className)} {...props} />;
}

function TableBody({ className, ...props }) {
    return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableRow({ className, ...props }) {
    return <tr className={cn("border-b border-ds-border transition-colors hover:bg-ds-muted/50", className)} {...props} />;
}

function TableHead({ className, ...props }) {
    return (
        <th
            className={cn("h-10 px-3 text-left align-middle text-xs font-medium uppercase tracking-wide text-ds-muted-foreground", className)}
            {...props}
        />
    );
}

function TableCell({ className, ...props }) {
    return <td className={cn("px-3 py-3 align-middle", className)} {...props} />;
}

function TableCaption({ className, ...props }) {
    return <caption className={cn("mt-4 text-sm text-ds-muted-foreground", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
