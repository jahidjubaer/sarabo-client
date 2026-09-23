import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

function TourWelcome({ open, onStart, onSkip }) {
    const handleOpenChange = (nextOpen) => {
        if (!nextOpen) onSkip();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-6 border-ds-primary/25 p-5 sm:p-6">
                <DialogHeader className="pr-7 text-left">
                    <p className="ds-label text-ds-primary">Quick orientation</p>
                    <DialogTitle className="mt-2 text-heading text-ds-popover-foreground">
                        Welcome to Sarabo
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-body-sm text-ds-muted-foreground">
                        Take a quick tour to see how to request a repair, explore services, track progress, and get support.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="sm:justify-start">
                    <Button variant="ghost" onClick={onSkip}>Skip</Button>
                    <Button variant="default" onClick={onStart}>Take a tour</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default TourWelcome;
