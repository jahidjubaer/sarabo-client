import { useCallback, useEffect, useMemo } from 'react';
import { ACTIONS, EVENTS, Joyride, STATUS } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router';
import useProductTour from '../../hooks/useProductTour';
import { prefersReducedMotion } from '../../theme/motion';
import TourTooltip from './TourTooltip';
import { TOUR_STEPS, TOUR_TARGETS } from './tourSteps';

const TARGET_CHECK_INTERVAL_MS = 75;
const TARGET_CHECK_LIMIT = 20;

function tourTargetsReady() {
    return TOUR_TARGETS.every((selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return false;
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
    });
}

function waitForTourTargets(onReady, onUnavailable) {
    let attempts = 0;
    let timeoutId;
    let cancelled = false;

    const checkTargets = () => {
        if (cancelled) return;
        if (tourTargetsReady()) {
            onReady();
            return;
        }

        attempts += 1;
        if (attempts >= TARGET_CHECK_LIMIT) {
            onUnavailable();
            return;
        }

        timeoutId = window.setTimeout(checkTargets, TARGET_CHECK_INTERVAL_MS);
    };

    checkTargets();

    return () => {
        cancelled = true;
        window.clearTimeout(timeoutId);
    };
}

function SaraboTour() {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        tourRunning,
        stepIndex,
        setStepIndex,
        startTour,
        exitTour,
        finishTour,
    } = useProductTour();

    const isHome = location.pathname === '/';
    const hasReplayQuery = useMemo(() => (
        new URLSearchParams(location.search).get('tour') === 'start'
    ), [location.search]);

    useEffect(() => {
        if (!isHome || !hasReplayQuery) return;

        const trigger = document.activeElement;
        return waitForTourTargets(
            () => {
                const searchParams = new URLSearchParams(location.search);
                searchParams.delete('tour');
                const nextSearch = searchParams.toString();
                navigate(
                    { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
                    { replace: true },
                );
                startTour({ trigger });
            },
            () => {
                const searchParams = new URLSearchParams(location.search);
                searchParams.delete('tour');
                const nextSearch = searchParams.toString();
                navigate(
                    { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
                    { replace: true },
                );
                exitTour();
            },
        );
    }, [
        exitTour,
        hasReplayQuery,
        isHome,
        location.pathname,
        location.search,
        navigate,
        startTour,
    ]);

    // The tour is opt-in (redesign Phase 2): it starts only from ?tour=start -
    // the hero's "Take the one-minute tour" chip or the footer link. (The
    // first-visit welcome dialog it replaced was removed in Phase 6.) Leaving
    // the homepage ends a running tour.
    useEffect(() => {
        if (!isHome && tourRunning) exitTour();
    }, [exitTour, isHome, tourRunning]);

    const handleJoyrideEvent = useCallback((event) => {
        if (event.type === EVENTS.TARGET_NOT_FOUND || event.type === EVENTS.ERROR) {
            exitTour();
            return;
        }

        if (event.type === EVENTS.STEP_AFTER) {
            if (event.action === ACTIONS.CLOSE) {
                exitTour();
                return;
            }

            if (event.action === ACTIONS.NEXT) {
                if (event.index >= TOUR_STEPS.length - 1) {
                    finishTour();
                } else {
                    setStepIndex(event.index + 1);
                }
            } else if (event.action === ACTIONS.PREV) {
                setStepIndex(Math.max(event.index - 1, 0));
            }
        }

        if (event.type === EVENTS.TOUR_END) {
            if (event.status === STATUS.FINISHED) finishTour();
            if (event.status === STATUS.SKIPPED) exitTour();
        }
    }, [exitTour, finishTour, setStepIndex]);

    const reducedMotion = prefersReducedMotion();

    return (
        <>
            <Joyride
                run={tourRunning}
                stepIndex={stepIndex}
                steps={TOUR_STEPS}
                continuous
                scrollToFirstStep
                onEvent={handleJoyrideEvent}
                tooltipComponent={TourTooltip}
                locale={{
                    back: 'Back',
                    close: 'Close tour',
                    last: 'Finish tour',
                    next: 'Next',
                    skip: 'Skip tour',
                }}
                options={{
                    arrowColor: 'var(--ds-popover)',
                    backgroundColor: 'var(--ds-popover)',
                    blockTargetInteraction: true,
                    buttons: ['back', 'close', 'primary', 'skip'],
                    closeButtonAction: 'skip',
                    dismissKeyAction: 'close',
                    overlayClickAction: false,
                    overlayColor: 'rgba(15, 36, 48, 0.72)',
                    primaryColor: 'var(--ds-primary)',
                    scrollDuration: reducedMotion ? 0 : 300,
                    scrollOffset: 88,
                    showProgress: true,
                    skipBeacon: true,
                    spotlightPadding: 8,
                    spotlightRadius: 12,
                    targetWaitTimeout: 1000,
                    textColor: 'var(--ds-popover-foreground)',
                    width: 'min(22rem, calc(100vw - 2rem))',
                    zIndex: 80,
                }}
            />
        </>
    );
}

export default SaraboTour;
