import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useParams } from 'react-router';
import useAxios from '../../hooks/useAxios';
import Loading from '../../components/Loading/Loading';
import { formatTrackingLabel } from '../../utils/trackingLabel';

const TrackRequest = () => {
    const { requestId } = useParams();
    const axiosInstance = useAxios();

    const {data: trackings = [], isLoading, isError} = useQuery({
        queryKey: ['tracking', requestId],
        queryFn: async () =>{
            const res  = await axiosInstance.get(`/trackings/${requestId}/logs`)
            return res.data;
        }
    })

    if (isLoading) {
        return <Loading></Loading>
    }

    if (isError) {
        return (
            <div className='p-8'>
                <h2 className='text-4xl font-bold'>Track your repair request: {requestId}</h2>
                <div role="alert" className="alert alert-error mt-6">
                    <span>We couldn&apos;t load the tracking timeline right now. Please try again later.</span>
                </div>
            </div>
        );
    }

    return (
        <div className='p-8'>
            <h2 className='text-4xl font-bold'>Track your repair request: {requestId}</h2>
            <p>Logs so far: {trackings.length}</p>

            <ul className="timeline timeline-vertical">
                {
                    trackings.map(log => <li key={log._id}>
                    <div className="timeline-start">
                        {new Date(log.createdAt).toLocaleString()}
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
                        <span className='text-xl'>{formatTrackingLabel(log.details)}</span>
                    </div>
                    <hr />
                </li>)
                }

                {
                    trackings.length === 0 && <p className='text-center py-8 opacity-60'>No status updates yet. Check back once your request is reviewed.</p>
                }

            </ul>
        </div>
    );
};

export default TrackRequest;
