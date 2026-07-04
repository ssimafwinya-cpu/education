"use client";

import { useState } from "react";
import { PageHero, Section } from "@/components/public/sections";
import { Mail, MapPin, Phone, Send, Check } from "lucide-react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div>
      <PageHero eyebrow="Contact" title="Get in touch with UNZANASA" subtitle="Questions, feedback or partnership enquiries — we'd love to hear from you." />

      <Section className="!py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {[
              { Icon: MapPin, t: "Address", d: "School of Natural Sciences, University of Zambia, Great East Road Campus, Lusaka" },
              { Icon: Mail, t: "Email", d: "info@unzanasa.org.zm" },
              { Icon: Phone, t: "Phone", d: "+260 211 000 000" },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="card flex items-start gap-4 p-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-600 dark:text-brand-300"><Icon size={19} /></div>
                <div><div className="font-semibold">{t}</div><div className="text-sm text-ink-muted">{d}</div></div>
              </div>
            ))}
          </div>

          <div className="card p-6">
            {sent ? (
              <div className="grid h-full place-items-center py-10 text-center">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-500/12 text-brand-500"><Check size={28} /></div>
                  <h3 className="mt-4 text-lg font-semibold">Message sent!</h3>
                  <p className="mt-1 text-sm text-ink-muted">Thanks for reaching out — the UNZANASA team will get back to you.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
                <h3 className="text-lg font-semibold">Send us a message</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input required className="input" placeholder="Your name" />
                  <input required type="email" className="input" placeholder="Email" />
                </div>
                <input className="input" placeholder="Subject" />
                <textarea required className="input min-h-[130px] resize-y" placeholder="Your message…" />
                <button type="submit" className="btn-primary w-full"><Send size={16} /> Send message</button>
              </form>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
