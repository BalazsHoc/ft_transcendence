import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">ft_transcendence</div>

      <nav className="footer-links flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]" aria-label="Legal">
        <Link className="transition-colors hover:text-[var(--text)]" to="/privacy-policy">
          Privacy Policy
        </Link>
        <Link className="transition-colors hover:text-[var(--text)]" to="/terms-of-service">
          Terms of Service
        </Link>
      </nav>

      <div className="contributors hidden sm:block">
        <span> (c) </span>
        <a href="mailto:mhoushma@student.42.fr" target="_blank" rel="noopener noreferrer">
          mhoushma
        </a>
        <span>, </span>
        <a href="mailto:bhocsak@student.42.fr" target="_blank" rel="noopener noreferrer">
          bhocsak
        </a>
        <span>, </span>
        <a href="mailto:cjuarez@student.42.fr" target="_blank" rel="noopener noreferrer">
          cjuarez
        </a>
        <span>, </span>
        <a href="mailto:oshcheho@student.42.fr" target="_blank" rel="noopener noreferrer">
          oshcheho
        </a>
        <span>, </span>
        <a href="mailto:pghajard@student.42.fr" target="_blank" rel="noopener noreferrer">
          pghajard
        </a>
      </div>
    </footer>
  );
}
