import React from 'react';
import { FaUser } from 'react-icons/fa';

const getInitials = name => {
    if (!name) return '';
    return name.trim().split(/\s+/).slice(0, 2).map(word => word[0]?.toUpperCase()).join('');
};

// Shows the real photo when a valid URL exists; otherwise shows initials or a
// neutral placeholder icon instead of a broken image box.
const Avatar = ({ src, name, size = 'w-16 h-16', className = '' }) => {
    if (src) {
        return (
            <div className={`avatar ${className}`}>
                <div className={`${size} rounded-full`}>
                    <img src={src} alt={name ? `${name}'s profile photo` : 'Profile photo'} />
                </div>
            </div>
        );
    }

    const initials = getInitials(name);

    return (
        <div className={`avatar avatar-placeholder ${className}`}>
            <div className={`bg-neutral text-neutral-content rounded-full ${size}`}>
                {
                    initials
                        ? <span aria-hidden="true">{initials}</span>
                        : <FaUser aria-hidden="true" />
                }
                <span className="sr-only">{name ? `${name}'s profile photo` : 'No profile photo set'}</span>
            </div>
        </div>
    );
};

export default Avatar;
