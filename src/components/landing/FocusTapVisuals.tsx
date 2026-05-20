import { motion } from "framer-motion";
import { Activity, BookOpen, Radio, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { CSSProperties } from "react";
import { ParallaxSection } from "@/components/animations";
import focustapLogo from "@/assets/focustap-logo.png";

const COLORS = {
  bg: "#09090f",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  muted: "#8585a0",
  light: "#e8e8f0",
  purple: "#8b6cff",
  cyan: "#22d3ee",
  green: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
};

const signalRows = [
  { label: "Focused", value: "92", color: COLORS.green },
  { label: "Note saves", value: "18", color: COLORS.cyan },
  { label: "Warnings", value: "03", color: COLORS.amber },
];

const seatCells = [
  COLORS.green, COLORS.green, COLORS.cyan, COLORS.green,
  COLORS.green, COLORS.amber, COLORS.green, COLORS.green,
  COLORS.cyan, COLORS.green, COLORS.rose, COLORS.green,
  COLORS.green, COLORS.green, COLORS.green, COLORS.cyan,
];

export function FocusTapBackdrop() {
  return (
    <div className="ft-visual-field" aria-hidden="true">
      <div className="ft-mesh-grid" />
      <div className="ft-signal-ribbon ft-signal-ribbon-one" />
      <div className="ft-signal-ribbon ft-signal-ribbon-two" />
      <div className="ft-signal-ribbon ft-signal-ribbon-three" />
      <div className="ft-scan-band" />
    </div>
  );
}

export function HeroShowcase() {
  return (
    <ParallaxSection depth={34} direction="up" className="ft-hero-parallax">
      <motion.div
        className="ft-hero-showcase"
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="ft-brand-media">
          <img src={focustapLogo} alt="FocusTap brand visual" />
          <div className="ft-brand-media-glass">
            <Sparkles style={{ width: 14, height: 14, color: COLORS.purple }} />
            <span>FocusTap identity</span>
          </div>
        </div>

        <div className="ft-live-console">
          <div className="ft-console-header">
            <div>
              <p>Live Session</p>
              <h2>Engagement Pulse</h2>
            </div>
            <span className="ft-live-pill">active</span>
          </div>

          <div className="ft-signal-meter">
            <div className="ft-meter-track">
              <div className="ft-meter-fill" />
            </div>
            <span>87%</span>
          </div>

          <div className="ft-signal-rows">
            {signalRows.map((row) => (
              <div key={row.label} className="ft-signal-row">
                <span style={{ background: row.color }} />
                <p>{row.label}</p>
                <strong style={{ color: row.color }}>{row.value}</strong>
              </div>
            ))}
          </div>

          <div className="ft-seat-map" aria-hidden="true">
            {seatCells.map((color, index) => (
              <span key={index} style={{ "--seat-color": color } as CSSProperties} />
            ))}
          </div>
        </div>
      </motion.div>
    </ParallaxSection>
  );
}

export function SignalStorySection() {
  const cards = [
    {
      icon: Radio,
      title: "Tap in without friction",
      body: "Students arrive through QR, NFC, or a class link and the session state starts flowing immediately.",
      color: COLORS.purple,
      image: focustapLogo,
    },
    {
      icon: BookOpen,
      title: "Notes become engagement signals",
      body: "Autosave, note activity, and focus time blend into a calmer picture of participation.",
      color: COLORS.cyan,
      image: focustapLogo,
    },
    {
      icon: Users,
      title: "Professors see the room breathe",
      body: "Seat maps, live status, and warnings update in a polished dashboard without surveilling screens.",
      color: COLORS.green,
      image: focustapLogo,
    },
  ];

  return (
    <section className="ft-signal-section">
      <div className="container mx-auto max-w-6xl">
        <div className="ft-section-kicker">FocusTap system</div>
        <div className="ft-section-heading-row">
          <h2>Visuals that feel like the product, not a template.</h2>
          <p>
            The landing flow now leans into FocusTap's own palette: violet for students,
            cyan for professors, green for active focus, and amber for attention moments.
          </p>
        </div>

        <div className="ft-story-grid">
          {cards.map((card, index) => (
            <motion.article
              key={card.title}
              className="ft-story-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
            >
              <div className="ft-story-image" style={{ borderColor: `${card.color}33` }}>
                <img src={card.image} alt="" loading="lazy" />
                <div className="ft-story-image-overlay" />
                <div className="ft-story-icon" style={{ color: card.color, borderColor: `${card.color}44`, background: `${card.color}16` }}>
                  <card.icon style={{ width: 17, height: 17 }} />
                </div>
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </motion.article>
          ))}
        </div>

        <div className="ft-motion-strip" aria-hidden="true">
          <div><Activity style={{ width: 16, height: 16 }} /> focus</div>
          <span />
          <div><ShieldCheck style={{ width: 16, height: 16 }} /> privacy</div>
          <span />
          <div><Radio style={{ width: 16, height: 16 }} /> realtime</div>
        </div>
      </div>
    </section>
  );
}
