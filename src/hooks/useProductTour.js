import { useCallback, useRef, useState } from 'react';

export const PRODUCT_TOUR_STORAGE_KEY = 'sarabo-product-tour-v1';

const VALID_TOUR_STATUSES = new Set(['skipped', 'completed']);

function readTourStatus() {
    if (typeof window === 'undefined') return null;

    try {
        const value = window.localStorage.getItem(PRODUCT_TOUR_STORAGE_KEY);
        return VALID_TOUR_STATUSES.has(value) ? value : null;
    } catch {
        return null;
    }
}

function writeTourStatus(value) {
    try {
        window.localStorage.setItem(PRODUCT_TOUR_STORAGE_KEY, value);
    } catch {
        // The in-memory status still prevents repeat prompts in this session.
    }
}

function focusWithoutScrolling(element) {
    if (!(element instanceof HTMLElement) || !element.isConnected || element === document.body) return false;
    element.focus({ preventScroll: true });
    return document.activeElement === element;
}

export default function useProductTour() {
    const [status, setStatus] = useState(readTourStatus);
    const [tourRunning, setTourRunning] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const focusReturnRef = useRef(null);

    const persistStatus = useCallback((nextStatus) => {
        setStatus(nextStatus);
        writeTourStatus(nextStatus);
    }, []);

    const rememberFocus = useCallback((element) => {
        focusReturnRef.current = element instanceof HTMLElement ? element : document.activeElement;
    }, []);

    const restoreFocus = useCallback(() => {
        const previous = focusReturnRef.current;
        focusReturnRef.current = null;

        window.setTimeout(() => {
            if (focusWithoutScrolling(previous)) return;
            focusWithoutScrolling(document.querySelector('#main-content'));
        }, 0);
    }, []);

    const startTour = useCallback(({ trigger } = {}) => {
        if (trigger !== undefined) rememberFocus(trigger);
        setStepIndex(0);

        if (status === null) {
            persistStatus('skipped');
        }

        setTourRunning(true);
    }, [persistStatus, rememberFocus, status]);

    const exitTour = useCallback(() => {
        setTourRunning(false);
        setStepIndex(0);
        restoreFocus();
    }, [restoreFocus]);

    const finishTour = useCallback(() => {
        setTourRunning(false);
        setStepIndex(0);
        persistStatus('completed');
        restoreFocus();
    }, [persistStatus, restoreFocus]);

    return {
        status,
        tourRunning,
        stepIndex,
        setStepIndex,
        startTour,
        exitTour,
        finishTour,
    };
}
