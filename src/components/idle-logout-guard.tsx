import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIdleLogout } from '@/hooks/use-idle-logout';
import { type SharedData } from '@/types';
import { usePage } from '@/lib/app';
import { TimerReset } from 'lucide-react';

/**
 * Signs the admin out after the configured period of inactivity (SESSION_IDLE_LIFETIME),
 * showing a countdown for the final minute so unsaved work is not lost by surprise.
 */
export function IdleLogoutGuard() {
    const { idleTimeout } = usePage<SharedData>().props;
    const { warning, secondsLeft, stay, signOut } = useIdleLogout(idleTimeout ?? 0);

    if (!idleTimeout) return null;

    const minutes = Math.round(idleTimeout / 60);

    return (
        <Dialog open={warning} onOpenChange={(open) => !open && stay()}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="bg-secondary/15 text-secondary mb-2 flex size-10 items-center justify-center rounded-full">
                        <TimerReset className="size-5" aria-hidden="true" />
                    </div>
                    <DialogTitle>Are you still there?</DialogTitle>
                    <DialogDescription>
                        For security you are signed out after {minutes} {minutes === 1 ? 'minute' : 'minutes'} without activity. You will be signed
                        out in{' '}
                        <strong className="text-foreground tabular-nums">
                            {secondsLeft} {secondsLeft === 1 ? 'second' : 'seconds'}
                        </strong>
                        .
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={signOut}>
                        Sign out now
                    </Button>
                    <Button type="button" onClick={stay} autoFocus>
                        Stay signed in
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
