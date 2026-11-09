import { api, apiPath, ApiError } from '@/lib/app';

/** JSON helper for calls that are not page actions, e.g. the receiving-agents import preview. */
export class HttpError extends Error {
    constructor(
        public status: number,
        public errors: Record<string, string[]> = {},
        message = 'Request failed',
    ) {
        super(message);
        this.name = 'HttpError';
    }

    /** First validation message for a field, if any. */
    first(field: string): string | undefined {
        return this.errors[field]?.[0];
    }
}

export async function postJson<T>(url: string, body: FormData | Record<string, unknown>): Promise<T> {
    try {
        const result = await api('POST', apiPath(url), body);
        return (result.data ?? result) as T;
    } catch (e) {
        const error = e as ApiError;
        throw new HttpError(error.status, error.errors, error.message);
    }
}
