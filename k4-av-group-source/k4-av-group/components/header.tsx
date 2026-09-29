'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { navigation } from '@/data/site';
import { Logo } from './logo';
export function Header() { const [open, setOpen] = useState(false); const pathname = usePathname(); const trigger = useRef<HTMLButtonElement>(null); useEffect(() => { if (!open)
    return; function key(e: KeyboardEvent) { if (e.key === 'Escape') {
    setOpen(false);
    trigger.current?.focus();
} } document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [open]); return <header className="header"><div className="header-inner"><Logo /><button ref={trigger} className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button><nav id="main-nav" aria-label="Main navigation" className={open ? 'nav open' : 'nav'}>{navigation.map(label => <Link key={label} href={`/${label.toLowerCase()}`} aria-current={pathname.startsWith(`/${label.toLowerCase()}`) ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</Link>)}<Link className="login-link" href="/login" onClick={() => setOpen(false)}>Client login</Link><Link className="button header-quote" href="/quote" onClick={() => setOpen(false)}>Request a quote<ArrowUpRight size={15}/></Link></nav></div></header>; }
