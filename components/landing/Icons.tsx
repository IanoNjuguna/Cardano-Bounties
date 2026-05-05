import React from "react";

export function Icon({ name }: { name: string }) {
  if (name === "bolt") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />
      </svg>
    );
  }

  if (name === "globe") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.1 3.8-5.1 3.8-9S14.5 5.1 12 3m0 18c-2.5-2.1-3.8-5.1-3.8-9S9.5 5.1 12 3M3.6 9h16.8M3.6 15h16.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
