"use client";

import { FormEvent, useState } from "react";

export function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="waitlist-success" role="status">
        <h3>You&apos;re on the list.</h3>
        <p>We&apos;ll reach out as soon as Cardano Bounties goes live. In the meantime, follow us on X for updates.</p>
      </div>
    );
  }

  return (
    <>
      <form className="waitlist-form" onSubmit={handleSubmit}>
        <input type="email" placeholder="Enter your email address" aria-label="Email address" required />
        <button type="submit">Join the Waitlist</button>
      </form>
      <small>No spam. We&apos;ll only email you when it matters.</small>
    </>
  );
}
