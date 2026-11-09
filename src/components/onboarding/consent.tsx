import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

/**
 * CR s3: users must review and confirm the Data Privacy and Consent notice before onboarding.
 */
export function ConsentNotice({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: string }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-muted/40 rounded-lg border p-4">
            <p className="text-navy text-sm font-semibold dark:text-white">Data Privacy and Consent</p>
            <div className={`text-muted-foreground mt-2 space-y-2 text-xs leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                <p>
                    FMDQ Group PLC and its subsidiaries ("FMDQ") collect the personal and corporate information you provide (names, contact
                    details, identification and registration numbers, bank and depository account details and supporting documents) to verify your
                    identity, onboard you to the e-Offering Platform, process subscriptions, allotments and lodgements, and meet regulatory
                    obligations.
                </p>
                <p>
                    Your information may be shared with the Transaction Sponsors of offers you participate in, the Securities and Exchange
                    Commission, the Central Bank of Nigeria, FMDQ Depository and other depositories, receiving agents and service providers acting on
                    FMDQ's instructions. It is processed in line with the Nigeria Data Protection Act 2023 and retained only as long as required by
                    law. You may request access to, correction of or deletion of your data by contacting FMDQ.
                </p>
            </div>
            <button type="button" onClick={() => setExpanded(!expanded)} className="text-navy mt-1 text-xs font-medium hover:underline dark:text-gold-light">
                {expanded ? 'Show less' : 'Read the full notice'}
            </button>
            <div className="mt-3 flex items-start gap-2">
                <Checkbox id="consent" checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
                <Label htmlFor="consent" className="text-sm leading-snug font-normal">
                    I have read and agree to the Data Privacy and Consent notice.
                </Label>
            </div>
            <InputError message={error} className="mt-2" />
        </div>
    );
}
