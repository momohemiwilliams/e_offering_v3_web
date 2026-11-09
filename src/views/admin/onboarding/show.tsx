import { DecisionDialog } from '@/components/decision-dialog';
import { PageHeader } from '@/components/page-header';
import { DetailList, Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format';
import { institutionStatus } from '@/lib/labels';
import { type Institution } from '@/types';
import { Head, router } from '@/lib/app';
import { FileText, Send } from 'lucide-react';

export default function OnboardingShow({
    institution,
    files,
    reviewer,
}: {
    institution: Institution & { type_label: string };
    files: { label: string; name?: string | null; url: string }[];
    reviewer: string | null;
}) {
    const pending = institution.status === 'pending';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Onboarding Requests', href: route('admin.onboarding.index') },
                { title: institution.reference, href: route('admin.onboarding.show', institution.id) },
            ]}
        >
            <Head title={institution.name} />
            <Page>
                <PageHeader
                    title={institution.name}
                    description={
                        <span className="flex items-center gap-2">
                            {institution.type_label} · {institution.reference} <StatusBadge map={institutionStatus} value={institution.status} />
                        </span>
                    }
                    actions={
                        pending ? (
                            <>
                                <DecisionDialog
                                    href={route('admin.onboarding.reject', institution.id)}
                                    title="Reject onboarding request"
                                    description="The applicant is emailed the reason."
                                    trigger="Reject"
                                    triggerVariant="outline"
                                    reasonField="reason"
                                    reasonRequired
                                    destructive
                                    confirmLabel="Reject request"
                                />
                                <DecisionDialog
                                    href={route('admin.onboarding.approve', institution.id)}
                                    title="Approve onboarding request"
                                    description="Every listed user is activated and emailed a link to set their password."
                                    trigger="Approve"
                                    confirmLabel="Approve"
                                />
                            </>
                        ) : institution.status === 'approved' ? (
                            <Button variant="outline" onClick={() => router.post(route('admin.onboarding.resend', institution.id))}>
                                <Send className="size-4" /> Resend password links
                            </Button>
                        ) : null
                    }
                />

                {institution.rejection_reason && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                        <strong>Rejection reason:</strong> {institution.rejection_reason}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <Section title="Request details" className="lg:col-span-2">
                        <DetailList
                            items={[
                                { label: 'Name', value: institution.name },
                                { label: 'Email', value: institution.email },
                                { label: 'Phone', value: institution.phone },
                                { label: 'Registration number', value: institution.registration_number },
                                { label: 'Address', value: institution.address },
                                { label: 'Contact person', value: institution.contact_name },
                                { label: 'Submitted', value: formatDateTime(institution.created_at) },
                                { label: 'Data privacy consent', value: institution.privacy_consent_at ? formatDateTime(institution.privacy_consent_at) : 'Not given' },
                                { label: 'Reviewed', value: institution.reviewed_at ? `${formatDateTime(institution.reviewed_at)}${reviewer ? ` by ${reviewer}` : ''}` : null },
                            ]}
                        />
                    </Section>
                    <Section title="Documents">
                        <ul className="space-y-2">
                            {files.map((f) => (
                                <li key={f.url}>
                                    <a href={f.url} target="_blank" rel="noreferrer" className="hover:bg-muted flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                                        <FileText className="text-gold size-4" />
                                        <span className="flex-1">{f.label}</span>
                                    </a>
                                </li>
                            ))}
                            {files.length === 0 && <li className="text-muted-foreground text-sm">No documents (not required for this account type).</li>}
                        </ul>
                    </Section>
                </div>

                <Section title="Users" flush>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                            <tr>
                                <th className="px-4 py-2.5">Name</th>
                                <th className="px-4 py-2.5">Email</th>
                                <th className="px-4 py-2.5">Phone</th>
                                <th className="px-4 py-2.5">Access level</th>
                                <th className="px-4 py-2.5">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(institution.users ?? []).map((u) => (
                                <tr key={u.id} className="border-b last:border-0">
                                    <td className="px-4 py-3">{u.name}</td>
                                    <td className="px-4 py-3">{u.email}</td>
                                    <td className="px-4 py-3">{u.phone ?? '—'}</td>
                                    <td className="px-4 py-3 capitalize">{u.access_level ?? '—'}</td>
                                    <td className="px-4 py-3 capitalize">{u.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Section>
            </Page>
        </AppLayout>
    );
}
