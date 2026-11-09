import { Button, type ButtonProps } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@/lib/app';
import { LoaderCircle } from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';

interface DecisionDialogProps {
    /** POST target. */
    href: string;
    title: string;
    description?: ReactNode;
    trigger: ReactNode;
    triggerVariant?: ButtonProps['variant'];
    triggerSize?: ButtonProps['size'];
    confirmLabel?: string;
    /** Extra fields sent with the request, e.g. { approve: false } or { valid: false }. */
    data?: Record<string, string | number | boolean | null>;
    /** Name and label of the free-text field, when one is shown. */
    reasonField?: string;
    reasonLabel?: string;
    reasonRequired?: boolean;
    destructive?: boolean;
    method?: 'post' | 'put';
}

/**
 * Confirmation dialog for approval-chain actions. Rejections always ask for a reason
 * (CR: "with the stated reason"), approvals optionally take a note.
 */
export function DecisionDialog({
    href,
    title,
    description,
    trigger,
    triggerVariant = 'default',
    triggerSize = 'default',
    confirmLabel = 'Confirm',
    data = {},
    reasonField,
    reasonLabel = 'Reason',
    reasonRequired = false,
    destructive = false,
    method = 'post',
}: DecisionDialogProps) {
    const [open, setOpen] = useState(false);
    const form = useForm<Record<string, string | number | boolean | null>>({ ...data, ...(reasonField ? { [reasonField]: '' } : {}) });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.transform(() => ({ ...data, ...(reasonField ? { [reasonField]: form.data[reasonField] } : {}) }));
        form[method](href, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    const error = reasonField ? (form.errors as Record<string, string>)[reasonField] : undefined;
    const otherErrors = Object.entries(form.errors as Record<string, string>).filter(([k]) => k !== reasonField);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={triggerVariant} size={triggerSize}>
                    {trigger}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription asChild><div>{description}</div></DialogDescription>}
                    </DialogHeader>
                    {reasonField && (
                        <div className="space-y-2">
                            <Label htmlFor={`${reasonField}-input`}>
                                {reasonLabel}
                                {reasonRequired && <span className="text-destructive"> *</span>}
                            </Label>
                            <Textarea
                                id={`${reasonField}-input`}
                                rows={4}
                                required={reasonRequired}
                                value={String(form.data[reasonField] ?? '')}
                                onChange={(e) => form.setData(reasonField, e.target.value)}
                            />
                            {error && <p className="text-destructive text-sm">{error}</p>}
                        </div>
                    )}
                    {otherErrors.length > 0 && (
                        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                            {otherErrors.map(([k, v]) => (
                                <p key={k}>{v}</p>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant={destructive ? 'destructive' : 'default'} disabled={form.processing}>
                            {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                            {confirmLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
