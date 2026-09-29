'use client';
import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';
type TurnstileAPI = {
    render: (el: HTMLElement, options: Record<string, unknown>) => string;
    remove: (id: string) => void;
};
declare global {
    interface Window {
        turnstile?: TurnstileAPI;
    }
}
export function Turnstile({ onToken, attempt }: {
    onToken: (token: string) => void;
    attempt: number;
}) { const ref = useRef<HTMLDivElement>(null); const id = useRef<string | null>(null); const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY; const render = useCallback(() => { if (!ref.current || !window.turnstile || !sitekey || id.current)
    return; id.current = window.turnstile.render(ref.current, { sitekey, theme: 'dark', callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken('') }); }, [sitekey, onToken]); useEffect(() => { render(); return () => { if (id.current && window.turnstile) {
    window.turnstile.remove(id.current);
    id.current = null;
} }; }, [render, attempt]); if (!sitekey)
    return null; return <div className="full"><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={render}/><div ref={ref}/></div>; }
