"use client";

import { FormEvent, useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
        <input
          type="email"
          placeholder="Enter your email address"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Joining..." : "Join the Waitlist"}
        </button>
      </form>
      {error && (
        <p className="waitlist-error" style={{ color: "#ff4d4d", fontSize: "12px", marginTop: "8px" }}>
          {error}
        </p>
      )}
      <small>No spam. We&apos;ll only email you when it matters.</small>
    </>
  );
}
