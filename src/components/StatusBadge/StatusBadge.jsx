import React from 'react';
import { humanizeStatus, getStatusBadgeClass } from '../../utils/statusBadge';

const StatusBadge = ({ status, className = '' }) => (
    <span className={`badge ${getStatusBadgeClass(status)} ${className}`}>
        {humanizeStatus(status)}
    </span>
);

export default StatusBadge;
