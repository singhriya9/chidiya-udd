interface SiteFooterProps {
  className?: string;
}

interface CreditLinksProps {
  className?: string;
}

export function CreditLinks({ className = '' }: CreditLinksProps) {
  return (
    <span className={className}>
      <a
        href="https://github.com/singhriya9"
        target="_blank"
        rel="noreferrer"
        className="text-slate-200 hover:text-white underline underline-offset-2 decoration-slate-400/70 hover:decoration-white transition-colors"
      >
        Riya Singh
      </a>{' '}
      ·{' '}
      <a
        href="mailto:itzriyasingh07@gmail.com"
        className="text-slate-200 hover:text-white underline underline-offset-2 decoration-slate-400/70 hover:decoration-white transition-colors"
      >
        Hire Me
      </a>
    </span>
  );
}

export function SiteFooter({ className = '' }: SiteFooterProps) {
  return (
    <footer
      className={`w-full text-center text-sm text-slate-500 ${className}`.trim()}
    >
      <p>
        Made with <span className="text-rose-400"> ❤️ </span> by <CreditLinks />
      </p>
    </footer>
  );
}
