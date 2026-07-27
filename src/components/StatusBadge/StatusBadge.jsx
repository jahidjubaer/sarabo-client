import React from 'react';
import { humanizeStatus, getStatusBadgeClass } from '../../utils/statusBadge';

// `label`, when provided, overrides the generic humanized text (e.g. a
// repair-specific mapping from utils/repairStatus.js) - the raw `status`
// value is still used for badge color, since that lookup already keys on
// the actual stored values.
const StatusBadge = ({ status, label, className = '' }) => (
    <span className={`badge ${getStatusBadgeClass(status)} ${className}`}>
        {label ?? humanizeStatus(status)}
    </span>
);

export default StatusBadge;
