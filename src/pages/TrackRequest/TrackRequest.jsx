import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import useAxios from '../../hooks/useAxios';
import Loading from '../../components/Loading/Loading';
import { getRepairStatusLabel } from '../../utils/repairStatus';

// Matches the server's tracking-code format guard (controllers/trackingController.js) -
// used here only for immediate client-side feedback on an obviously invalid
// submission, never to decide whether to call the API.
const TRACKING_CODE_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

const TrackRequest = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const axiosInstance = useAxios();
    const [codeInput, setCodeInput] = useState('');
    const [formError, setFormError] = useState('');

    // Unauthenticated by design - this is the public, sanitized tracking
    // contract (GET /public/trackings/:trackingCode), never the private
    // /trackings/:trackingId/logs endpoint used by signed-in dashboards.
    const { data, isLoading, error } = useQuery({
        queryKey: ['public-tracking', requestId],
        queryFn: async () => {
            const res = await axiosInstance.get(`/public/trackings/${encodeURIComponent(requestId)}`);
            return res.data;
        },
        enabled: !!requestId,
        retry: false
    });

    const handleSubmit = e => {
        e.preventDefault();
        const trimmed = codeInput.trim();
        if (!TRACKING_CODE_PATTERN.test(trimmed)) {
            setFormError('Enter a valid tracking code.');
            return;
        }
        setFormError('');
        navigate(`/track-request/${encodeURIComponent(trimmed)}`);
    };

    // Initial/instructions state - no tracking code in the URL yet.
    if (!requestId) {
        return (
            <div className="p-8 max-w-md mx-auto">
                <h2 className="text-4xl font-bold">Track Repair</h2>
                <p className="opacity-70 mt-2">Enter your tracking code to see your repair progress.</p>
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
                    <input
                        type="text"
                        value={codeInput}
                        onChange={e => setCodeInput(e.target.value)}
                        placeholder="e.g. SRB-..."
                        className={`input w-full ${formError ? 'input-error' : ''}`}
                        aria-invalid={formError ? 'true' : 'false'}
                    />
                    {formError && <p role="alert" className="text-red-500 text-sm">{formError}</p>}
                    <button type="submit" className="btn btn-primary">Track Repair</button>
                </form>
            </div>
        );
    }

    if (isLoading) {
        return <Loading></Loading>
    }

    if (error) {
        const httpStatus = error?.response?.status;
        let title = 'Tracking Code Not Found';
        let message = 'We could not find that tracking code. Please check it and try again.';
        if (httpStatus === 429) {
            title = 'Too Many Requests';
            message = 'Please wait a moment before trying again.';
        } else if (httpStatus >= 500 || !httpStatus) {
            title = 'We Could Not Load Your Repair Tracking';
            message = 'This looks temporary - please try again in a moment.';
        }
        return (
            <div className="p-8">
                <h2 className="text-4xl font-bold">{title}</h2>
                <div role="alert" className="alert alert-error mt-6">
                    <span>{message}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h2 className="text-4xl font-bold">Track Repair</h2>
            <p className="opacity-70 mt-2">Tracking Code: {data.trackingCode}</p>
            <p className="mt-4">
                Current Repair Status: <span className="font-semibold">{getRepairStatusLabel(data.currentStatus)}</span>
            </p>
            <p className="opacity-60 text-sm mt-1">Last Updated: {new Date(data.updatedAt).toLocaleString()}</p>

            <h3 className="text-2xl font-semibold mt-8 mb-2">Repair Progress</h3>
            <ul className="timeline timeline-vertical">
                {
                    data.timeline.map((entry, i) => <li key={i}>
                        <div className="timeline-start">
                            {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div className="timeline-middle">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-5 w-5"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="timeline-end timeline-box">
                            <span className="text-xl">{getRepairStatusLabel(entry.status)}</span>
                        </div>
                        <hr />
                    </li>)
                }
                {
                    data.timeline.length === 0 && <p className="text-center py-8 opacity-60">No status updates yet. Check back once your request is reviewed.</p>
                }
            </ul>
        </div>
    );
};

export default TrackRequest;
