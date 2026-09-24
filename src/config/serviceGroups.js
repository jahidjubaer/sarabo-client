import devicesPhoto from '../assets/card-television.jpg';
import appliancesPhoto from '../assets/card-washing-machine.jpg';

// The two service "gateways" the public site leads with. They group the
// server's canonical productCategorySlug values - they never invent a
// category. A slug the server adds later that is not listed here falls into
// `devices`, so it is always shown somewhere.
export const SERVICE_GROUPS = [
    {
        key: 'devices',
        title: 'Phone, computer & TV repair',
        short: 'Phones, computers & TVs',
        description: 'Cracked screens, batteries, charging, boot and display faults.',
        photo: devicesPhoto,
        photoAlt: 'A technician testing the circuit boards on the back of a flat-screen television with a multimeter.',
        slugs: ['smartphone', 'laptop-computer', 'television', 'other-electronics'],
    },
    {
        key: 'appliances',
        title: 'Home appliance repair',
        short: 'Home appliances',
        description: 'Cooling, heating, spinning, draining and servicing faults.',
        photo: appliancesPhoto,
        photoAlt: 'A technician kneeling at the front of a washing machine with an open toolbox beside them.',
        slugs: ['refrigerator', 'washing-machine', 'air-conditioner', 'microwave-oven'],
    },
];

const APPLIANCE_SLUGS = new Set(SERVICE_GROUPS[1].slugs);

export function getServiceGroupKey(slug) {
    return APPLIANCE_SLUGS.has(slug) ? 'appliances' : 'devices';
}

export function getServiceGroupAnchor(key) {
    return `/services#${key}`;
}
