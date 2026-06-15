"use client";

import { useState, useRef, useEffect } from "react";
import { useLang, Lang } from "@/lib/i18n";
import "./LangSwitcher.css";

const LANGS: { code: Lang; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

function FlagIcon({ code }: { code: Lang }) {
  switch (code) {
    case "uz":
      return (
        <svg className="lang-sw-flag" viewBox="0 0 24 16" aria-hidden="true">
          <rect width="24" height="16" rx="2" fill="#fff" />
          <rect width="24" height="5" rx="2" fill="#0099b5" />
          <rect y="11" width="24" height="5" rx="2" fill="#1eb53a" />
          <rect y="5" width="24" height="1" fill="#ce1126" />
          <rect y="10" width="24" height="1" fill="#ce1126" />
          <path d="M5 2.5a1.7 1.7 0 100 3 1.4 1.4 0 110-3z" fill="#fff" />
          <circle cx="6.4" cy="2.6" r="0.35" fill="#fff" />
          <circle cx="7.5" cy="2.6" r="0.35" fill="#fff" />
          <circle cx="6.4" cy="3.7" r="0.35" fill="#fff" />
          <circle cx="7.5" cy="3.7" r="0.35" fill="#fff" />
        </svg>
      );
    case "ru":
      return (
        <svg className="lang-sw-flag" viewBox="0 0 24 16" aria-hidden="true">
          <rect width="24" height="16" rx="2" fill="#fff" />
          <rect y="5.33" width="24" height="5.34" fill="#0039a6" />
          <rect y="10.67" width="24" height="5.33" fill="#d52b1e" />
        </svg>
      );
    case "en":
      return (
        <svg className="lang-sw-flag" viewBox="0 0 24 16" aria-hidden="true">
          <rect width="24" height="16" fill="#012169" />
          <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="3.2" />
          <path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" strokeWidth="1.8" />
          <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5.3" />
          <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3.2" />
        </svg>
      );
  }
}

export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(code: Lang) {
    setLang(code);
    setOpen(false);
  }

  return (
    <div className="lang-sw" ref={ref}>
      <button
        className="lang-sw-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
      >
        <FlagIcon code={current.code} />
        <span className="lang-sw-code">{current.label}</span>
        <svg className={`lang-sw-arrow${open ? " open" : ""}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="lang-sw-dropdown">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={`lang-sw-item${l.code === lang ? " active" : ""}`}
              onClick={() => pick(l.code)}
            >
              <FlagIcon code={l.code} />
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
