import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

export type OnboardUser = {
    name: string;
    email: string;
    phone: string;
    access_level: 'inputter' | 'authoriser';
};

/**
 * Authorised users with an Inputter / Authoriser access level. Submission needs at least
 * one of each (CR s3.2 step 3); the checklist makes that visible before submitting.
 */
export function UsersEditor({
    users,
    onChange,
    errors,
}: {
    users: OnboardUser[];
    onChange: (users: OnboardUser[]) => void;
    errors: Record<string, string>;
}) {
    const set = (i: number, patch: Partial<OnboardUser>) => onChange(users.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));
    const hasInputter = users.some((u) => u.access_level === 'inputter');
    const hasAuthoriser = users.some((u) => u.access_level === 'authoriser');

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-xs">
                {[
                    ['At least one Inputter', hasInputter],
                    ['At least one Authoriser', hasAuthoriser],
                ].map(([label, ok]) => (
                    <span key={String(label)} className={`flex items-center gap-1 ${ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {ok ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />} {label}
                    </span>
                ))}
            </div>
            {users.map((u, i) => (
                <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_0.8fr_0.9fr_auto] sm:items-start">
                    <div>
                        <Input placeholder="Full name" value={u.name} onChange={(e) => set(i, { name: e.target.value })} aria-label={`User ${i + 1} name`} required />
                        <InputError message={errors[`users.${i}.name`]} />
                    </div>
                    <div>
                        <Input type="email" placeholder="Email address" value={u.email} onChange={(e) => set(i, { email: e.target.value })} aria-label={`User ${i + 1} email`} required />
                        <InputError message={errors[`users.${i}.email`]} />
                    </div>
                    <Input placeholder="Phone (optional)" value={u.phone} onChange={(e) => set(i, { phone: e.target.value })} aria-label={`User ${i + 1} phone`} />
                    <select
                        value={u.access_level}
                        onChange={(e) => set(i, { access_level: e.target.value as OnboardUser['access_level'] })}
                        aria-label={`User ${i + 1} access level`}
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                    >
                        <option value="inputter">Inputter</option>
                        <option value="authoriser">Authoriser</option>
                    </select>
                    <Button type="button" variant="ghost" size="icon" disabled={users.length <= 2} onClick={() => onChange(users.filter((_, idx) => idx !== i))} aria-label="Remove user">
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => onChange([...users, { name: '', email: '', phone: '', access_level: 'inputter' }])}>
                <Plus className="size-4" /> Add user
            </Button>
            <InputError message={errors.users} />
        </div>
    );
}

export const defaultUsers: OnboardUser[] = [
    { name: '', email: '', phone: '', access_level: 'inputter' },
    { name: '', email: '', phone: '', access_level: 'authoriser' },
];
