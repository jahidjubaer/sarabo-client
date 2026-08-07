import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from '../ui/dropdown-menu';
import { useTheme } from '../../theme/useTheme';

const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

// Light / Dark / System theme picker. The trigger shows the currently resolved
// theme's icon; the menu is a radio group so the active choice is announced.
function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const TriggerIcon = resolvedTheme === 'dark' ? Moon : Sun;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Change theme">
                    <TriggerIcon className="size-5" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    {THEME_OPTIONS.map((option) => {
                        const OptionIcon = option.icon;
                        return (
                            <DropdownMenuRadioItem key={option.value} value={option.value}>
                                <OptionIcon className="size-4" aria-hidden="true" />
                                {option.label}
                            </DropdownMenuRadioItem>
                        );
                    })}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export { ThemeToggle };
