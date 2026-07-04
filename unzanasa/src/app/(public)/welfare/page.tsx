import { PageHero, Section, FeatureGrid } from "@/components/public/sections";
import { HeartHandshake, Brain, Wallet, Users, ShieldCheck, Phone } from "lucide-react";

export default function Welfare() {
  return (
    <div>
      <PageHero eyebrow="Student Welfare" title="We look after the whole student" subtitle="Wellbeing, mentorship, financial guidance and a support network for every Natural Sciences student." />

      <Section title="Support services">
        <FeatureGrid items={[
          { icon: <Brain size={20} />, title: "Counselling & Mental Health", desc: "Links to UNZA counselling services and peer-support networks.", tone: "brand" },
          { icon: <Wallet size={20} />, title: "Financial Aid Guidance", desc: "Information on bursaries, scholarships and hardship funds.", tone: "accent" },
          { icon: <Users size={20} />, title: "Mentorship", desc: "Pairing junior students with seniors and alumni mentors.", tone: "gold" },
          { icon: <ShieldCheck size={20} />, title: "Advocacy", desc: "Representing student interests to faculty and administration.", tone: "crimson" },
          { icon: <HeartHandshake size={20} />, title: "Peer Support", desc: "Study buddies, accommodation help and settling-in support.", tone: "brand" },
          { icon: <Phone size={20} />, title: "Helpline", desc: "A confidential first point of contact for any student concern.", tone: "accent" },
        ]} />
      </Section>

      <Section title="Need help now?" className="!pb-16">
        <div className="rounded-3xl px-8 py-10 text-center text-white" style={{ background: "linear-gradient(135deg,#0b4030,#0f766e)" }}>
          <HeartHandshake size={28} className="mx-auto text-gold" />
          <h2 className="mt-3 text-2xl font-bold">Reach the Welfare Secretary</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/75">All conversations are confidential. Contact the welfare team through the Member Portal or the contact page.</p>
        </div>
      </Section>
    </div>
  );
}
