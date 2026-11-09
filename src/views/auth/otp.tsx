import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, router, useForm } from '@/lib/app';
import { LoaderCircle, MailCheck } from 'lucide-react';
import { ClipboardEvent, FormEventHandler, KeyboardEvent, useRef, useState } from 'react';

const LENGTH = 6;

/**
 * Step 2 of sign-in: the emailed one-time password. Boxes accept paste of the whole code
 * and are grouped for screen readers (the legacy OTP boxes were neither).
 */
export default function Otp({ email, ttl, status }: { email: string; ttl: number; status?: string }) {
    const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const { setData, post, processing, errors } = useForm({ code: '' });
    const [resending, setResending] = useState(false);

    const update = (next: string[]) => {
        setDigits(next);
        setData('code', next.join(''));
    };

    const onChange = (i: number, value: string) => {
        const v = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = v;
        update(next);
        if (v && i < LENGTH - 1) refs.current[i + 1]?.focus();
    };

    const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    };

    const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
        if (!pasted) return;
        e.preventDefault();
        const next = Array(LENGTH)
            .fill('')
            .map((_, i) => pasted[i] ?? '');
        update(next);
        refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login.otp.verify'));
    };

    const resend = () => {
        setResending(true);
        router.post(route('login.otp.resend'), {}, { preserveScroll: true, onFinish: () => setResending(false) });
    };

    return (
        <AuthLayout title="Enter your sign-in code" description={`We sent a ${LENGTH}-digit code to ${email}. It expires in ${ttl} minutes.`}>
            <Head title="Verify sign-in" />
            <div className="bg-gold/15 text-navy mx-auto mb-6 flex size-14 items-center justify-center rounded-full dark:text-gold-light">
                <MailCheck className="size-7" />
            </div>

            {status && <div className="mb-4 text-center text-sm font-medium text-emerald-600">{status}</div>}

            <form onSubmit={submit} className="space-y-6">
                <fieldset>
                    <legend className="sr-only">One-time password</legend>
                    <div className="flex justify-center gap-2">
                        {digits.map((d, i) => (
                            <input
                                key={i}
                                ref={(el) => {
                                    refs.current[i] = el;
                                }}
                                value={d}
                                inputMode="numeric"
                                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                aria-label={`Digit ${i + 1}`}
                                autoFocus={i === 0}
                                maxLength={1}
                                onChange={(e) => onChange(i, e.target.value)}
                                onKeyDown={(e) => onKeyDown(i, e)}
                                onPaste={onPaste}
                                className="focus:border-navy focus:ring-navy/20 bg-background size-12 rounded-xl border text-center text-xl font-semibold outline-none focus:ring-4 sm:size-14"
                            />
                        ))}
                    </div>
                    <InputError message={errors.code} className="mt-3 text-center" />
                </fieldset>

                <Button type="submit" className="w-full" disabled={processing || digits.join('').length !== LENGTH}>
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    Verify &amp; sign in
                </Button>
            </form>

            <div className="text-muted-foreground mt-6 flex items-center justify-between text-sm">
                <button type="button" onClick={resend} disabled={resending} className="text-navy font-medium hover:underline disabled:opacity-50 dark:text-gold-light">
                    {resending ? 'Sending…' : 'Resend code'}
                </button>
                <Link href={route('login')} className="hover:underline">
                    Use a different account
                </Link>
            </div>
        </AuthLayout>
    );
}
