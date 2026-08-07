import { useNavigate } from 'react-router';
import {
    CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '../ui/command';
import { getCommandDestinations } from '../../config/dashboardNavigation';

// Client-side NAVIGATION command palette (Phase 7.2). Filters a fixed list of
// role-appropriate dashboard destinations - it performs NO backend or entity
// search (no fake request/customer results). Opened via the header trigger or
// Ctrl/Cmd+K (handled by the shell). Selecting an item navigates and closes.
function CommandMenu({ role, open, onOpenChange }) {
    const navigate = useNavigate();
    const destinations = getCommandDestinations(role);

    const groups = destinations.reduce((accumulator, destination) => {
        (accumulator[destination.group] ||= []).push(destination);
        return accumulator;
    }, {});

    const go = (to) => {
        onOpenChange(false);
        navigate(to);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search dashboard..." />
            <CommandList>
                <CommandEmpty>No matching destinations.</CommandEmpty>
                {Object.entries(groups).map(([heading, items]) => (
                    <CommandGroup key={heading} heading={heading}>
                        {items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <CommandItem
                                    key={item.to}
                                    value={`${item.label} ${item.to}`}
                                    onSelect={() => go(item.to)}
                                >
                                    {Icon ? <Icon aria-hidden="true" /> : null}
                                    <span>{item.label}</span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                ))}
            </CommandList>
        </CommandDialog>
    );
}

export { CommandMenu };
