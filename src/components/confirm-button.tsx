import { Button, type ButtonProps } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { router } from '@/lib/app';
import { useState } from 'react';

interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick'> {
    title: string;
    description?: string;
    confirmLabel?: string;
    method?: 'delete' | 'post';
    href: string;
    data?: Record<string, string | number | boolean | null>;
    onSuccess?: () => void;
}

export function ConfirmButton({
    title,
    description,
    confirmLabel = 'Confirm',
    method = 'delete',
    href,
    data,
    onSuccess,
    children,
    ...props
}: ConfirmButtonProps) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const confirm = () => {
        setBusy(true);
        router.visit(href, {
            method,
            data: data ?? {},
            preserveScroll: true,
            onFinish: () => {
                setBusy(false);
                setOpen(false);
            },
            onSuccess,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" {...props}>
                    {children}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                        Cancel
                    </Button>
                    <Button type="button" variant={method === 'delete' ? 'destructive' : 'default'} onClick={confirm} disabled={busy}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
