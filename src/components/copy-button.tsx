import { Button, type ButtonProps } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function CopyButton({ value, label = 'Copy link', ...props }: ButtonProps & { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            window.prompt('Copy this link', value);
        }
    };

    return (
        <Button type="button" variant="ghost" size="sm" onClick={copy} title={label} {...props}>
            {copied ? <Check className="text-emerald-600" /> : <Copy />}
            <span className="sr-only">{label}</span>
        </Button>
    );
}
