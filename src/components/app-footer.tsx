const socials = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/fmdqgroup', path: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C21.5 8.65 22 11 22 14v7h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21h-4V9Z' },
    { label: 'X', href: 'https://x.com/fmdqgroup', path: 'M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.2h1.7L7.4 4.7H5.58l11.09 14.5Z' },
    { label: 'Instagram', href: 'https://www.instagram.com/fmdqgroup', path: 'M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21.9 8.2c-.07-1.5-.4-2.8-1.5-3.9s-2.4-1.43-3.9-1.5C14.94 2.7 9.06 2.7 7.5 2.8c-1.5.07-2.8.4-3.9 1.5S2.17 6.7 2.1 8.2C2 9.76 2 15.24 2.1 16.8c.07 1.5.4 2.8 1.5 3.9s2.4 1.43 3.9 1.5c1.56.1 7.44.1 9 0 1.5-.07 2.8-.4 3.9-1.5s1.43-2.4 1.5-3.9c.1-1.56.1-7.04 0-8.6Z' },
    { label: 'Facebook', href: 'https://www.facebook.com/fmdqgroup', path: 'M14 8V6.2c0-.8.2-1.2 1.4-1.2H17V2h-2.6C11.6 2 10.7 3.4 10.7 5.8V8H8.5v3h2.2v11H14V11h2.7l.4-3H14Z' },
];

/** Legacy footer content, kept: social links, "Powered by iQx" and the SEC disclaimer bar. */
export function AppFooter() {
    return (
        <footer className="mt-auto">
            <div className="text-muted-foreground flex flex-col gap-3 border-t px-4 py-4 text-xs md:flex-row md:items-center md:justify-between md:px-6">
                <div className="flex items-center gap-3">
                    <span>Stay connected with us</span>
                    <div className="flex gap-2">
                        {socials.map((s) => (
                            <a
                                key={s.label}
                                href={s.href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={s.label}
                                className="hover:bg-navy flex size-7 items-center justify-center rounded-full border transition hover:text-white"
                            >
                                <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden>
                                    <path d={s.path} />
                                </svg>
                            </a>
                        ))}
                    </div>
                </div>
                <div className="md:text-right">
                    <p>
                        Powered by <span className="text-foreground font-medium">iQx Consult Limited</span>
                    </p>
                    <p>Copyright &copy; {new Date().getFullYear()} FMDQ Group PLC. All rights reserved.</p>
                </div>
            </div>
            <div className="bg-navy-dark px-4 py-2.5 text-center text-xs text-[#e3c87a] italic">
                FMDQ Depository Limited is registered and regulated by the Securities and Exchange Commission, Nigeria
            </div>
        </footer>
    );
}
