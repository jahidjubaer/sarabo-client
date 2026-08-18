import airConditioner from '../../assets/card-air-conditioner.jpg';
import laptopComputer from '../../assets/card-laptop-computer.jpg';
import microwaveOven from '../../assets/card-microwave-oven.jpg';
import otherElectronics from '../../assets/card-other-electronics.jpg';
import refrigerator from '../../assets/card-refrigerator.jpg';
import smartphone from '../../assets/card-smartphone.jpg';
import television from '../../assets/card-television.jpg';
import washingMachine from '../../assets/card-washing-machine.jpg';

// Photograph for each product category on the homepage service grid.
//
// KEYED ON THE SERVER'S CANONICAL productCategorySlug, not on a marketing
// alias, so a card can never end up showing the wrong device. A slug with no
// entry here simply renders without a photograph - the card still works, so a
// category added on the server never breaks the page or shows a stand-in image
// of something else.
//
// TO REPLACE A PHOTOGRAPH: drop a new JPG over the matching file in
// src/assets/ (keep the exact card-<slug>.jpg name - the import resolves on
// it, and a .jpeg will fail the build) and update the `alt` text with it.
// Landscape images crop best: the band is 16:9 and centred, so a square or
// portrait source loses its top and bottom.
//
// `credit` is OPTIONAL and exists only to satisfy licences that require
// attribution. Omit it for a photograph that needs none. Never leave a credit
// attached to a replaced image - it would attribute someone else's work to a
// photograph that is not theirs.
const CATEGORY_PHOTOS = {
    'air-conditioner': {
        src: airConditioner,
        alt: 'A technician in a cap and work overalls servicing the open indoor unit of a wall-mounted air conditioner.',
    },
    'laptop-computer': {
        src: laptopComputer,
        alt: 'A technician in safety glasses and gloves working inside an opened laptop at a bench, with a memory module and a circuit board laid out beside it.',
    },
    'microwave-oven': {
        src: microwaveOven,
        alt: 'A technician in overalls opening the casing of a countertop microwave oven with a screwdriver, a tool tray on the worktop in front.',
    },
    'other-electronics': {
        src: otherElectronics,
        alt: 'A printed circuit board photographed from above.',
        credit: '“SEG DVD 430 – Printed circuit board” by Raimond Spekking, Wikimedia Commons, CC BY-SA 4.0',
    },
    refrigerator: {
        src: refrigerator,
        alt: 'A technician kneeling behind a refrigerator pulled out from a kitchen wall, working on the compressor and coils at the back.',
    },
    smartphone: {
        src: smartphone,
        alt: 'A gloved technician lifting a component off an opened smartphone mainboard with tweezers, a second dismantled handset and precision screwdrivers on the bench.',
    },
    television: {
        src: television,
        alt: 'A technician probing the exposed circuit boards on the back of a flat-screen television with a multimeter.',
    },
    'washing-machine': {
        src: washingMachine,
        alt: 'A technician kneeling at the front of a washing machine with the detergent drawer removed and an open toolbox beside them.',
    },
};

export function getCategoryPhoto(slug) {
    return CATEGORY_PHOTOS[slug] || null;
}

// Attribution for exactly the photographs actually on screen. CC BY and CC BY-SA
// both require credit wherever the work is shown, and crediting images that are
// not displayed would be noise.
export function getPhotoCredits(slugs) {
    return slugs
        .map((slug) => CATEGORY_PHOTOS[slug]?.credit)
        .filter(Boolean);
}
