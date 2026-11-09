import { SelectField, TextField } from '@/components/form-field';
import { DecisionDialog } from '@/components/decision-dialog';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { Page, Section } from '@/components/section';
import { ToneBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format';
import { type Paginated } from '@/types';
import { Head, router, useForm } from '@/lib/app';
import { UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Row {
    id: number;
    name: string;
    email: string;
    type: string;
    access_level: string | null;
    status: string;
    last_login_at: string | null;
    role_label: string;
    institution: string | null;
}

const types = [
    ['', 'All users'],
    ['admin', 'FMDQ Admin'],
    ['csd', 'CSD'],
    ['tsp', 'TSP/RM'],
    ['investor', 'Investors'],
    ['regulator', 'Regulators'],
];

interface ChangeRequest {
    id: number;
    action: string;
    target_name: string;
    target_email: string;
    created_at: string;
    requester: string | null;
    can_review: boolean;
}

const actionLabel: Record<string, string> = { create: 'New staff account', disable: 'Disable user', enable: 'Enable user' };

export default function UsersIndex({ users, requests, filters }: { users: Paginated<Row>; requests: ChangeRequest[]; filters: { type?: string; search?: string } }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '', email: '', type: 'admin' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('admin.users.store'), { onSuccess: () => (setOpen(false), form.reset()) });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Users', href: route('admin.users.index') }]}>
            <Head title="Users" />
            <Page>
                <PageHeader
                    title="Users"
                    description="Everyone with access to the platform. Add FMDQ staff here; external users join through onboarding."
                    actions={
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="size-4" /> Add FMDQ user
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={submit} className="space-y-4">
                                    <DialogHeader>
                                        <DialogTitle>Add FMDQ staff user</DialogTitle>
                                    </DialogHeader>
                                    <TextField label="Full name" required value={form.data.name} onChange={(v) => form.setData('name', v)} error={form.errors.name} />
                                    <TextField label="Email" type="email" required value={form.data.email} onChange={(v) => form.setData('email', v)} error={form.errors.email} />
                                    <SelectField
                                        label="Role"
                                        required
                                        value={form.data.type}
                                        onChange={(v) => form.setData('type', v)}
                                        options={[
                                            { value: 'admin', label: 'FMDQ Admin' },
                                            { value: 'csd', label: 'CSD / FMDQ Depository' },
                                        ]}
                                        error={form.errors.type}
                                    />
                                    <DialogFooter>
                                        <Button type="submit" disabled={form.processing}>
                                            Submit for approval
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    }
                />
                {requests.length > 0 && (
                    <Section title="Waiting for approval" description="A second admin must approve each staff account change." flush>
                        <ul className="divide-y">
                            {requests.map((r) => (
                                <li key={r.id} className="flex flex-col gap-3 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium">
                                            {actionLabel[r.action] ?? r.action}: {r.target_name}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {r.target_email} · requested by {r.requester} · {formatDateTime(r.created_at)}
                                        </p>
                                    </div>
                                    {r.can_review ? (
                                        <div className="flex gap-2">
                                            <DecisionDialog href={route('admin.user-requests.reject', r.id)} title="Reject this change" trigger="Reject" triggerVariant="outline" triggerSize="sm" reasonField="comment" reasonRequired destructive confirmLabel="Reject" />
                                            <DecisionDialog href={route('admin.user-requests.approve', r.id)} title="Approve this change" trigger="Approve" triggerSize="sm" confirmLabel="Approve" />
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">Waiting for another admin</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}
                <Section flush>
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <select
                            value={filters.type ?? ''}
                            onChange={(e) => router.get(route('admin.users.index'), { ...filters, type: e.target.value || undefined }, { preserveState: true })}
                            aria-label="User type"
                            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                        >
                            {types.map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                        <SearchForm url={route('admin.users.index')} initial={filters.search ?? ''} extra={{ type: filters.type }} placeholder="Name or email" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-4 py-2.5">Name</th>
                                    <th className="px-4 py-2.5">Role</th>
                                    <th className="px-4 py-2.5">Institution</th>
                                    <th className="px-4 py-2.5">Last sign-in</th>
                                    <th className="px-4 py-2.5">Status</th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((u) => (
                                    <tr key={u.id} className="border-b last:border-0">
                                        <td className="px-4 py-3">
                                            {u.name}
                                            <span className="text-muted-foreground block text-xs">{u.email}</span>
                                        </td>
                                        <td className="px-4 py-3">{u.role_label}</td>
                                        <td className="px-4 py-3">{u.institution ?? '—'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{u.last_login_at ? formatDateTime(u.last_login_at) : 'Never'}</td>
                                        <td className="px-4 py-3">
                                            <ToneBadge tone={u.status === 'active' ? 'success' : u.status === 'pending' ? 'warning' : 'neutral'}>{u.status}</ToneBadge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {u.status !== 'pending' && (
                                                <Button size="sm" variant="outline" onClick={() => router.post(route('admin.users.status', u.id), {}, { preserveScroll: true })}>
                                                    {u.status === 'disabled' ? 'Enable' : 'Disable'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={users as Paginated<unknown>} />
                </Section>
            </Page>
        </AppLayout>
    );
}
