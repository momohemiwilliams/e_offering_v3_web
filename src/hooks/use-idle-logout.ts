import { api, router } from '@/lib/app';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Shared across tabs so activity in one tab keeps the others signed in. */
const STORAGE_KEY = 'eoffering.last-activity';
/** How often, at most, activity is reported to the server (keeps its idle timer in step). */
const PING_EVERY_MS = 60_000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;
/** While the warning is showing, only deliberate input counts as "I'm still here". */
const PASSIVE_EVENTS: ReadonlySet<string> = new Set(['mousemove', 'scroll', 'wheel']);

export interface IdleLogoutState {
    /** True when the countdown dialog should be showing. */
    warning: boolean;
    /** Seconds until automatic sign-out (only meaningful while warning). */
    secondsLeft: number;
    /** Reset the idle timer and tell the server the user is still here. */
    stay: () => void;
    /** Sign out immediately with the inactivity message. */
    signOut: () => void;
}

function readShared(): number {
    try {
        return Number(localStorage.getItem(STORAGE_KEY)) || 0;
    } catch {
        return 0;
    }
}

function writeShared(time: number): void {
    try {
        localStorage.setItem(STORAGE_KEY, String(time));
    } catch {
        // Private mode or storage disabled: this tab still tracks itself.
    }
}

/**
 * Signs the user out after `timeoutSeconds` without activity, warning them
 * `warnSeconds` beforehand. Pass 0 to disable.
 */
export function useIdleLogout(timeoutSeconds: number, warnSeconds = 60): IdleLogoutState {
    const [state, setState] = useState({ warning: false, secondsLeft: 0 });
    const lastActivity = useRef(Date.now());
    const lastPing = useRef(Date.now());
    const warningRef = useRef(false);
    const loggingOut = useRef(false);

    const signOut = useCallback(() => {
        if (loggingOut.current) return;
        loggingOut.current = true;
        router.post(route('logout'), { inactive: true }, { onFinish: () => (loggingOut.current = false) });
    }, []);

    const ping = useCallback(() => {
        lastPing.current = Date.now();
        // A 401 here means the server already ended the session; api() then sends the browser to sign-in.
        api('GET', 'session/ping').catch(() => {});
    }, [signOut]);

    const markActive = useCallback(() => {
        const now = Date.now();
        lastActivity.current = now;
        writeShared(now);
        if (now - lastPing.current > PING_EVERY_MS) ping();
    }, [ping]);

    const stay = useCallback(() => {
        markActive();
        ping();
        warningRef.current = false;
        setState({ warning: false, secondsLeft: 0 });
    }, [markActive, ping]);

    useEffect(() => {
        if (!timeoutSeconds || timeoutSeconds <= 0) return;

        const timeout = timeoutSeconds * 1000;
        const warn = Math.min(warnSeconds, Math.floor(timeoutSeconds / 2)) * 1000;

        const onActivity = (event: Event) => {
            if (warningRef.current && PASSIVE_EVENTS.has(event.type)) return;
            // Throttle: a stream of mousemove events only needs one write a second.
            if (Date.now() - lastActivity.current < 1000 && !warningRef.current) return;
            markActive();
            if (warningRef.current) {
                warningRef.current = false;
                setState({ warning: false, secondsLeft: 0 });
            }
        };

        const tick = () => {
            const idle = Date.now() - Math.max(lastActivity.current, readShared());

            if (idle >= timeout) {
                warningRef.current = false;
                setState({ warning: false, secondsLeft: 0 });
                signOut();
                return;
            }

            if (idle >= timeout - warn) {
                warningRef.current = true;
                setState({ warning: true, secondsLeft: Math.max(1, Math.ceil((timeout - idle) / 1000)) });
            } else if (warningRef.current) {
                warningRef.current = false;
                setState({ warning: false, secondsLeft: 0 });
            }
        };

        // A page load or navigation is activity in itself.
        lastActivity.current = Date.now();
        writeShared(lastActivity.current);

        ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
        document.addEventListener('visibilitychange', tick);
        const interval = window.setInterval(tick, 1000);

        return () => {
            ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
            document.removeEventListener('visibilitychange', tick);
            window.clearInterval(interval);
        };
    }, [timeoutSeconds, warnSeconds, markActive, signOut]);

    return { ...state, stay, signOut };
}
