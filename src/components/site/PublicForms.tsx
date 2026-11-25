"use client";

import { useState, type FormEvent } from "react";
import { Input } from "../ui";

export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setFeedback("");
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, message }),
      });
      const data = (await res.json()) as {
        referenceId?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setFeedback("Check all fields (phone at least 7 digits, message at least 10 characters).");
        return;
      }
      setStatus("done");
      setFeedback(`${data.message} Reference: ${data.referenceId}`);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("Could not send while offline. Message us on WhatsApp at 0791149592.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-xl font-bold text-navy">Send us a message</h2>
      <p className="text-xs text-navy/65">
        Our support desk at Pwata Inc replies by email or WhatsApp (+256).
      </p>
      <Input
        label="Your name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Sarah Namukasa"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Phone or WhatsApp (+256)"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0791149592"
        />
        <Input
          label="Email address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="block text-sm font-bold text-navy">
          How can we help?
        </label>
        <textarea
          id="contact-message"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your shop, branch setup, or device enquiry..."
          className="w-full rounded-xl border border-navy/20 bg-white px-3.5 py-2.5 text-base text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>
      <button type="submit" disabled={status === "sending"} className="btn-primary w-full sm:w-auto">
        {status === "sending" ? "Sending..." : "Send message"}
      </button>
      {feedback ? (
        <p
          className={`rounded-xl p-3 text-xs font-semibold ${
            status === "error" ? "bg-guava-soft text-navy" : "bg-teal-soft text-navy"
          }`}
        >
          {feedback}
        </p>
      ) : null}
    </form>
  );
}

export function AccountDeletionForm() {
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setFeedback("");
    try {
      const res = await fetch("/api/public/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, businessName, phone, reason }),
      });
      const data = (await res.json()) as {
        referenceId?: string;
        retentionNote?: string;
        error?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setFeedback("Enter a valid email, business name and phone number.");
        return;
      }
      setStatus("done");
      setFeedback(`Request logged (${data.referenceId}). ${data.retentionNote}`);
      setEmail("");
      setBusinessName("");
      setPhone("");
      setReason("");
    } catch {
      setStatus("error");
      setFeedback("Network error. Email ubombo256@gmail.com to request deletion.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-xl font-bold text-navy">Request account deletion</h2>
      <p className="text-xs text-navy/65">
        After receiving your request, Pwata Inc verifies account ownership before removing
        workspace records.
      </p>
      <Input
        label="Account email address"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="owner@shop.ug"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Business or shop name"
          required
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Kiwafu Traders"
        />
        <Input
          label="Phone number linked to account"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0791149592"
        />
      </div>
      <Input
        label="Reason for deletion (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Optional feedback"
      />
      <button type="submit" disabled={status === "sending"} className="btn-guava w-full sm:w-auto">
        {status === "sending" ? "Submitting..." : "Request account deletion"}
      </button>
      {feedback ? (
        <p
          className={`rounded-xl p-3 text-xs font-semibold ${
            status === "error" ? "bg-guava-soft text-navy" : "bg-teal-soft text-navy"
          }`}
        >
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
