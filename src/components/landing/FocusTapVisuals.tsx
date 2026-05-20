import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Activity, BookOpen, QrCode, Radio, ShieldCheck, Users } from "lucide-react";
import { useRef, type CSSProperties } from "react";

const COLORS = {
  bg: "#f6f2ea",
  card: "rgba(255,255,255,0.72)",
  border: "rgba(31,41,55,0.10)",
  muted: "#667085",
  light: "#111827",
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
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const easedProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.32 });
  const y = useTransform(easedProgress, [0, 1], [36, -44]);
  const rotateX = useTransform(easedProgress, [0, 0.5, 1], [2.5, 0, -2]);
  const scale = useTransform(easedProgress, [0, 0.38, 1], [0.985, 1, 0.992]);

  return (
    <motion.div
      ref={ref}
      className="ft-hero-showcase"
      initial={{ opacity: 0, y: 24, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
      style={{ y, rotateX, scale }}
    >
      <div className="ft-product-frame">
        <div className="ft-browser-bar">
          <div className="ft-window-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p>focustap.org/live-session</p>
        </div>

        <div className="ft-product-grid">
          <div className="ft-session-panel">
            <div className="ft-panel-title">
              <span style={{ background: COLORS.green }} />
              <div>
                <p>Biology 202</p>
                <h2>Active classroom session</h2>
              </div>
            </div>
            <div className="ft-stat-strip">
              <div>
                <strong>87%</strong>
                <span>Focus score</span>
              </div>
              <div>
                <strong>142</strong>
                <span>Checked in</span>
              </div>
              <div>
                <strong>34m</strong>
                <span>Avg time</span>
              </div>
            </div>
            <svg className="ft-curve-chart" viewBox="0 0 560 150" aria-hidden="true">
              <defs>
                <linearGradient id="ftChartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.purple} stopOpacity="0.32" />
                  <stop offset="100%" stopColor={COLORS.purple} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 116 C64 84 106 120 162 72 C218 25 270 92 326 58 C389 20 426 78 482 38 C514 18 536 18 560 24" fill="none" stroke={COLORS.purple} strokeWidth="4" strokeLinecap="round" />
              <path d="M0 116 C64 84 106 120 162 72 C218 25 270 92 326 58 C389 20 426 78 482 38 C514 18 536 18 560 24 L560 150 L0 150 Z" fill="url(#ftChartFill)" />
              <circle cx="560" cy="24" r="7" fill={COLORS.cyan} />
            </svg>
          </div>

          <div className="ft-note-panel">
            <div className="ft-note-toolbar">
              <BookOpen style={{ width: 15, height: 15 }} />
              <span>Live notes</span>
            </div>
            <p>Cell signaling depends on receptors, pathway cascades, and feedback loops.</p>
            <div className="ft-note-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="ft-live-console">
          <div className="ft-console-header">
            <div>
              <p>Engagement Pulse</p>
              <h2>Room signal</h2>
            </div>
            <span className="ft-live-pill">live</span>
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
      </div>
    </motion.div>
  );
}

export function SignalStorySection() {
  const cards = [
    {
      icon: Radio,
      title: "Tap in without friction",
      body: "Students arrive through QR, NFC, or a class link and the session state starts flowing immediately.",
      color: COLORS.purple,
      visual: "join",
    },
    {
      icon: BookOpen,
      title: "Notes become engagement signals",
      body: "Autosave, note activity, and focus time blend into a calmer picture of participation.",
      color: COLORS.cyan,
      visual: "notes",
    },
    {
      icon: Users,
      title: "Professors see the room breathe",
      body: "Seat maps, live status, and warnings update in a polished dashboard without surveilling screens.",
      color: COLORS.green,
      visual: "room",
    },
  ];

  return (
    <section className="ft-signal-section">
      <div className="container mx-auto max-w-6xl">
        <div className="ft-section-kicker">FocusTap system</div>
        <div className="ft-section-heading-row">
          <h2>Scroll through the classroom flow.</h2>
          <p>
            FocusTap is about a live classroom flow: students checking in, notes saving,
            and professors seeing calm engagement signals at a glance.
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
              transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, rotate: index % 2 === 0 ? -0.35 : 0.35 }}
            >
              <div className="ft-story-visual" style={{ borderColor: `${card.color}33` }}>
                <StoryVisual type={card.visual} color={card.color} />
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

function StoryVisual({ type, color }: { type: string; color: string }) {
  if (type === "join") {
    return (
      <div className="ft-join-visual" aria-hidden="true">
        <div className="ft-qr-mark">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className={index % 3 === 0 ? "active" : ""} />
          ))}
        </div>
        <div className="ft-phone-card">
          <QrCode style={{ width: 22, height: 22, color }} />
          <span>Tap to join</span>
        </div>
      </div>
    );
  }

  if (type === "notes") {
    return (
      <div className="ft-notes-visual" aria-hidden="true">
        <div className="ft-editor-bar">
          <span />
          <span />
          <span />
        </div>
        <p>Lecture notes saved</p>
        <div>
          <span style={{ width: "88%" }} />
          <span style={{ width: "72%" }} />
          <span style={{ width: "94%" }} />
          <span style={{ width: "58%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="ft-room-visual" aria-hidden="true">
      {seatCells.slice(0, 12).map((seatColor, index) => (
        <span key={index} style={{ "--seat-color": seatColor } as CSSProperties} />
      ))}
    </div>
  );
}
