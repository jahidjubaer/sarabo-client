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
        content: 'Start here: describe the device and the fault, and follow the repair from inspection to handover.',
        placement: 'bottom-start',
    },
    {
        id: 'services',
        target: TOUR_TARGETS[1],
        title: 'Explore repair services',
        content: 'Choose phones and computers or home appliances to see what we repair and the starting prices.',
        placement: 'bottom-start',
    },
    {
        id: 'repair-process',
        target: TOUR_TARGETS[2],
        title: 'Follow the repair process',
        content: 'Four stages, and nothing is repaired until you approve the itemised quote.',
        placement: 'bottom-start',
    },
    {
        id: 'track-repair',
        target: TOUR_TARGETS[3],
        title: 'Track your progress',
        content: 'Have a tracking code? Check progress here without signing in.',
        placement: 'bottom-start',
    },
    {
        id: 'ai-support',
        target: TOUR_TARGETS[4],
        title: 'Get support when needed',
        content: 'Ask Sarabo answers general questions about repairs, quotes, payment and tracking.',
        placement: 'top-end',
        isFixed: true,
        skipScroll: true,
    },
];
