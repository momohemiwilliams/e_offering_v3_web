import { Head, Link, useForm } from '@/lib/app';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

/**
 * Step 1 of sign-in (email + password). A one-time password is then emailed (CR "Login").
 */
export default function Login({ status }: { status?: string }) {
    const [show, setShow] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<{ email: string; password: string; remember: boolean }>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout title="Sign in" description="Use your registered email address and password.">
            <Head title="Sign in" />

            {status && <div className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{status}</div>}

            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        autoFocus
                        autoComplete="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="name@company.com"
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <TextLink href={route('password.request')} className="ml-auto text-sm">
                            Forgot password?
                        </TextLink>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={show ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShow(!show)}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 p-1"
                            aria-label={show ? 'Hide password' : 'Show password'}
                        >
                            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={data.remember} onCheckedChange={(v) => setData('remember', v === true)} />
                    <Label htmlFor="remember" className="font-normal">
                        Keep me signed in on this device
                    </Label>
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    {processing ? 'Processing…' : 'Sign in'}
                </Button>
            </form>

            <p className="text-muted-foreground mt-6 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href={route('onboarding.choose')} className="text-navy font-medium underline-offset-4 hover:underline dark:text-gold-light">
                    Sign up
                </Link>
            </p>
        </AuthLayout>
    );
}
