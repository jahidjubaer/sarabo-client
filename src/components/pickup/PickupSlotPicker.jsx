import { useId, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { usePickupSlots } from '../../hooks/usePickupSlots';
import { encodePickupChoice, parsePickupChoice, formatPickupDate } from '../../utils/pickupSlots';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

function slotStatus(slot, closed) {
    if (closed) return 'Closed';
    if (slot.available) return slot.remaining === 1 ? '1 place left' : 'Available';
    if (slot.remaining === 0) return 'Fully booked';
    return 'Too soon';
}

const chip = 'focus-within:ring-2 focus-within:ring-ds-ring focus-within:ring-offset-1 focus-within:ring-offset-ds-background';

// Pickup day and time chooser (pickup-scheduling phase). Two native radio
// groups - the day, then the 2-hour slot - so keyboard and screen-reader use
// work without extra code. `value`/`onChange` carry one "YYYY-MM-DD|slotId"
// string. Slots come from the server for the chosen region; nothing here
// decides what is open.
function PickupSlotPicker({ region, value, onChange, error, errorId, currentChoice }) {
    const id = useId();
    const { data, isPending, isError, isPaused, refetch } = usePickupSlots(region);
    const chosen = parsePickupChoice(value);
    const days = data?.days ?? [];
    const firstOpenDay = days.find((day) => day.slots.some((slot) => slot.available))?.date;
    const [pickedDay, setPickedDay] = useState(null);
    const activeDate = pickedDay || chosen?.date || firstOpenDay || days[0]?.date;
    const activeDay = days.find((day) => day.date === activeDate);

    if (!region) {
        return <p className="rounded-ds-lg bg-ds-muted p-3 text-body-sm text-ds-muted-foreground">Pick a region first to see pickup times.</p>;
    }
    if (isPending && !isPaused) {
        return <div className="space-y-3"><Skeleton className="h-11 w-full" /><Skeleton className="h-24 w-full" /></div>;
    }
    if (isError || isPaused || !data) {
        return (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-ds-lg bg-ds-muted p-3 text-body-sm text-ds-muted-foreground">
                Pickup times could not be loaded.
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
            </div>
        );
    }
    if (!firstOpenDay) {
        return <p className="rounded-ds-lg bg-ds-muted p-3 text-body-sm text-ds-muted-foreground">No pickup times are free in the next 7 days for this region. Please check again later.</p>;
    }

    return (
        <div className="space-y-4" aria-describedby={error ? errorId : undefined}>
            <fieldset>
                <legend className="mb-2 text-body-sm font-semibold text-ds-foreground">Day</legend>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {days.map((day) => {
                        const open = !day.closed && day.slots.some((slot) => slot.available);
                        const selected = day.date === activeDate;
                        return (
                            <label
                                key={day.date}
                                className={cn(
                                    'flex min-h-11 min-w-20 shrink-0 cursor-pointer flex-col items-center justify-center rounded-ds border px-3 py-1.5 text-center transition-colors',
                                    chip,
                                    selected ? 'border-ds-primary bg-ds-primary text-ds-primary-foreground' : 'border-ds-border bg-ds-background text-ds-foreground hover:bg-ds-muted',
                                    !open && !selected && 'text-ds-muted-foreground',
                                )}
                            >
                                <input
                                    type="radio"
                                    name={`${id}-day`}
                                    value={day.date}
                                    checked={selected}
                                    onChange={() => setPickedDay(day.date)}
                                    className="sr-only"
                                />
                                <span className="text-micro font-semibold">{day.weekday.slice(0, 3)}</span>
                                <span className="text-body-sm font-bold">{formatPickupDate(day.date, { weekday: undefined })}</span>
                                {day.closed && <span className="text-micro">Closed</span>}
                            </label>
                        );
                    })}
                </div>
            </fieldset>

            {activeDay && (
                <fieldset>
                    <legend className="mb-2 text-body-sm font-semibold text-ds-foreground">
                        Time on {formatPickupDate(activeDay.date, { weekday: 'long' })}
                    </legend>
                    {activeDay.closed ? (
                        <p className="rounded-ds-lg bg-ds-muted p-3 text-body-sm text-ds-muted-foreground">We do not collect on Fridays. Please pick another day.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {activeDay.slots.map((slot) => {
                                const slotValue = encodePickupChoice(activeDay.date, slot.slotId);
                                // The request's current slot stays choosable even when full,
                                // since it already holds that place.
                                const isCurrent = currentChoice === slotValue;
                                const disabled = !slot.available && !isCurrent;
                                const selected = value === slotValue;
                                return (
                                    <label
                                        key={slot.slotId}
                                        className={cn(
                                            'flex min-h-11 items-center gap-3 rounded-ds border px-3 py-2 transition-colors',
                                            chip,
                                            disabled ? 'cursor-not-allowed border-ds-border text-ds-muted-foreground opacity-60' : 'cursor-pointer',
                                            selected ? 'border-ds-primary bg-ds-accent' : !disabled && 'border-ds-border hover:bg-ds-muted',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name={`${id}-slot`}
                                            value={slotValue}
                                            checked={selected}
                                            disabled={disabled}
                                            onChange={() => onChange(slotValue)}
                                            className="size-4 accent-ds-primary"
                                        />
                                        <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-body-sm font-semibold">{slot.label}</span>
                                            <span className="block text-micro">{isCurrent ? 'Your current time' : slotStatus(slot, activeDay.closed)}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </fieldset>
            )}
            {error ? <p id={errorId} className="text-xs font-medium text-ds-destructive">{error}</p> : null}
        </div>
    );
}

export { PickupSlotPicker };
