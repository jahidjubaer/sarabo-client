export const TOUR_TARGETS = [
    '[data-tour="request-repair"]',
    '[data-tour="services"]',
    '[data-tour="repair-process"]',
    '[data-tour="track-repair"]',
    '[data-tour="ai-support"]',
];

export const TOUR_STEPS = [
    {
        id: 'request-repair',
        target: TOUR_TARGETS[0],
        title: 'Request a repair',
        content: 'Customers can describe the device and problem here, then follow the repair from assignment through completion.',
        placement: 'bottom-start',
    },
    {
        id: 'services',
        target: TOUR_TARGETS[1],
        title: 'Explore repair services',
        content: 'See the device groups Sarabo supports and review indicative estimates before inspection.',
        placement: 'bottom-start',
    },
    {
        id: 'repair-process',
        target: TOUR_TARGETS[2],
        title: 'Follow the repair process',
        content: 'Request, inspection, quote approval, and completion form one clear, trackable journey.',
        placement: 'bottom-start',
    },
    {
        id: 'track-repair',
        target: TOUR_TARGETS[3],
        title: 'Track your progress',
        content: 'When you have a tracking code, use Track a repair to check customer-facing repair progress.',
        placement: 'top',
    },
    {
        id: 'ai-support',
        target: TOUR_TARGETS[4],
        title: 'Get support when needed',
        content: 'Open Ask Sarabo for general guidance about repairs, quotations, payments, tracking, and using the platform.',
        placement: 'top-end',
        isFixed: true,
        skipScroll: true,
    },
];
