import { useState } from 'react';
import { Download } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { downloadPaymentReceipt } from '../../api/payments';
import { LoadingButton } from '../common/LoadingButton';
import { notify } from '../../lib/notify';

// "Download receipt (PDF)" for one payment. Accepts every Button prop.
function ReceiptDownloadButton({ transactionId, onDownload, children = 'Download receipt (PDF)', ...props }) {
    const axiosSecure = useAxiosSecure();
    const [loading, setLoading] = useState(false);

    if (!transactionId) return null;

    const handleClick = async () => {
        onDownload?.();
        setLoading(true);
        try {
            await downloadPaymentReceipt(axiosSecure, transactionId);
        } catch {
            notify.error("Couldn't download the receipt. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoadingButton type="button" variant="outline" loading={loading} loadingText="Preparing receipt…" onClick={handleClick} {...props}>
            <Download aria-hidden="true" />{children}
        </LoadingButton>
    );
}

export { ReceiptDownloadButton };
