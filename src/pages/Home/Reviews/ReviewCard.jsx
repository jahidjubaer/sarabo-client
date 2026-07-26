import React from 'react';
import { FaQuoteLeft } from 'react-icons/fa';
import Avatar from '../../../components/Avatar/Avatar';

const ReviewCard = ({ review }) => {
    const { userName, review: testimonial, user_photoURL } = review;
    return (
        <div className="max-w-sm bg-base-100 shadow-lg rounded-xl p-6 border border-gray-200">
            {/* Quote Icon */}
            <FaQuoteLeft className="text-primary text-2xl mb-4" />

            {/* Review Text */}
            <p className="mb-4">
                {testimonial}
            </p>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Profile */}
            <div className="flex items-center gap-4">
                <Avatar src={user_photoURL} name={userName} size="w-10 h-10" />
                <div>
                    <h3 className="font-semibold text-lg">{userName}</h3>
                </div>
            </div>
        </div>
    );
};

export default ReviewCard;