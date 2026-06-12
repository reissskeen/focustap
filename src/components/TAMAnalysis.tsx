import { useState } from "react";

const TAMData = {
  segments: [
    {
      id: "universities",
      label: "Private Universities & Colleges",
      icon: "🎓",
      institutions: 1754,
      institutionNote: "nonprofit degree-granting",
      enrollment: "5.4M",
      enrollmentDetail: "2.7M nonprofit + 0.6M for-profit undergraduate; rest graduate",
      avgTuition: "$45,000",
      tuitionNote: "avg published tuition, private nonprofit 4-year (2025–26)",
      marketRevenue: "$327B+",
      revenueNote: "private nonprofit institutional revenue (NCES IPEDS 2024)",
      avgSize: "2,269",
      sizeNote: "avg enrollment per private campus",
      keyFact: "Private colleges held the largest higher-ed revenue share globally in 2025 at 57%",
      color: "#6366F1",
    },
    {
      id: "highschools",
      label: "Private High Schools",
      icon: "🏫",
      institutions: 3626,
      institutionNote: "secondary & high schools (grades 9–12)",
      enrollment: "830K+",
      enrollmentDetail: "~14% of total private K-12 enrollment",
      avgTuition: "$17,954",
      tuitionNote: "national avg private high school tuition (2025–26)",
      marketRevenue: "$14.9B",
      revenueNote: "estimated from enrollment × avg tuition",
      avgSize: "229",
      sizeNote: "avg students per private secondary school",
      keyFact: "Elite independent day schools now exceed $50K/year; boarding tops $70K+",
      color: "#8B5CF6",
    },
    {
      id: "middleschools",
      label: "Private Middle Schools",
      icon: "📚",
      institutions: 5400,
      institutionNote: "est. standalone + combined middle-level programs (grades 6–8)",
      enrollment: "1.2M",
      enrollmentDetail: "middle-grade enrollment within the private elementary/middle category",
      avgTuition: "$14,018",
      tuitionNote: "avg private elementary/middle tuition (2025–26)",
      marketRevenue: "$16.8B",
      revenueNote: "estimated from enrollment × avg tuition",
      avgSize: "176",
      sizeNote: "avg students per private school overall",
      keyFact: "87% of private schools enroll fewer than 300 students, creating a highly fragmented market",
      color: "#A78BFA",
    },
    {
      id: "elementary",
      label: "Private Elementary Schools",
      icon: "✏️",
      institutions: 12400,
      institutionNote: "elementary schools (grades K–5/6), largest private segment by count",
      enrollment: "2.8M",
      enrollmentDetail: "~86% of K-12 private students are in grades K–8",
      avgTuition: "$14,018",
      tuitionNote: "avg private elementary tuition (2025–26)",
      marketRevenue: "$39.3B",
      revenueNote: "estimated from enrollment × avg tuition",
      avgSize: "160",
      sizeNote: "avg students per private elementary school",
      keyFact: "Catholic schools make up ~39% of all private schools and charge the least at ~$9,720/yr",
      color: "#C4B5FD",
    },
  ],
  totalMarket: {
    totalK12Schools: "29,730",
    totalK12Enrollment: "4.7–5.7M",
    totalK12Revenue: "$79.5B",
    totalUniversities: "4,024",
    totalUnivEnrollment: "5.4M+",
    totalUnivRevenue: "$347B+",
    grandTotalInstitutions: "~33,750",
    grandTotalRevenue: "$427B+",
  },
  growth: [
    { label: "School voucher program participation growth (2024→2025)", value: "+25%" },
    { label: "States with private school choice policies", value: "34" },
    { label: "Students in choice programs (2024–25)", value: "1.3M+" },
    { label: "EdTech in higher education CAGR (2025–2030)", value: "19.4%" },
    { label: "Private K-12 industry 5-year projected revenue (2030)", value: "$92.3B" },
  ],
};

const font = "'Plus Jakarta Sans', sans-serif";

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} className="p-4">
      <div className="text-xs uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: font, fontWeight: 500 }}>{label}</div>
      <div className="text-2xl font-bold text-white" style={{ fontFamily: font }}>{value}</div>
      {note && <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: font }}>{note}</div>}
    </div>
  );
}

function SegmentCard({
  segment,
  isExpanded,
  onClick,
}: {
  segment: typeof TAMData.segments[number];
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl p-5 transition-all duration-300"
      style={{
        background: isExpanded
          ? `linear-gradient(135deg, ${segment.color}15, ${segment.color}08)`
          : "rgba(255,255,255,0.03)",
        border: isExpanded ? `1px solid ${segment.color}40` : "1px solid rgba(255,255,255,0.06)",
        fontFamily: font,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{segment.icon}</span>
          <div>
            <div className="text-white font-semibold text-base">{segment.label}</div>
            <div className="text-gray-400 text-xs">{segment.institutions.toLocaleString()} institutions</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: segment.color }}>{segment.marketRevenue}</div>
          <div className="text-gray-500 text-xs">market revenue</div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Enrollment", val: segment.enrollment, note: segment.enrollmentDetail },
              { label: "Avg Tuition", val: segment.avgTuition, note: segment.tuitionNote },
              { label: "Avg School Size", val: `${segment.avgSize} students`, note: segment.sizeNote },
              { label: "Institution Count", val: segment.institutions.toLocaleString(), note: segment.institutionNote },
            ].map(({ label, val, note }) => (
              <div key={label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8 }} className="p-3">
                <div className="text-gray-400 text-xs mb-1">{label}</div>
                <div className="text-white font-semibold">{val}</div>
                <div className="text-gray-500 text-xs mt-0.5">{note}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", borderLeft: `2px solid ${segment.color}`, borderRadius: "0 8px 8px 0" }} className="p-3">
            <div className="text-gray-400 text-xs mb-1">Key Insight</div>
            <div className="text-gray-300 text-sm">{segment.keyFact}</div>
          </div>
          <div className="text-gray-400 text-xs italic">{segment.revenueNote}</div>
        </div>
      )}

      {!isExpanded && (
        <div className="flex gap-4 text-xs text-gray-500 mt-1">
          <span>{segment.enrollment} students</span>
          <span>•</span>
          <span>{segment.avgTuition} avg tuition</span>
          <span className="ml-auto text-gray-400">tap to expand ↓</span>
        </div>
      )}
    </div>
  );
}

function BarVisualization() {
  const values = [
    { label: "Universities & Colleges", revenue: 347, color: "#6366F1" },
    { label: "K-12 Private Schools", revenue: 79.5, color: "#8B5CF6" },
  ];
  const max = 347;
  return (
    <div className="space-y-3">
      {values.map((v) => (
        <div key={v.label}>
          <div className="flex justify-between text-xs text-gray-400 mb-1" style={{ fontFamily: font }}>
            <span>{v.label}</span>
            <span className="font-semibold text-white">${v.revenue}B</span>
          </div>
          <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(v.revenue / max) * 100}%`,
                background: `linear-gradient(90deg, ${v.color}, ${v.color}88)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TAMAnalysis() {
  const [expandedSegment, setExpandedSegment] = useState<string | null>("universities");

  return (
    <div className="space-y-6" style={{ fontFamily: font }}>
      {/* TAM Summary */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(139,108,255,0.10), rgba(34,211,238,0.04))",
          border: "1px solid rgba(139,108,255,0.25)",
        }}
      >
        <div className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: "#8b6cff" }}>
          FocusTap TAM Summary
        </div>
        <p className="text-gray-200 text-sm leading-relaxed mb-4">
          The U.S. private education market includes roughly{" "}
          <span className="text-white font-semibold">33,700 private institutions</span> serving about{" "}
          <span className="text-white font-semibold">10 million students</span> across private K–12 schools and private
          postsecondary institutions.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div
            style={{ background: "rgba(139,108,255,0.12)", border: "1px solid rgba(139,108,255,0.2)", borderRadius: 12 }}
            className="p-4 text-center"
          >
            <div className="text-2xl font-extrabold text-white">~$500M</div>
            <div className="text-xs text-gray-400 mt-1">Annual TAM @ $50/student</div>
            <div className="text-xs mt-1" style={{ color: "#8b6cff" }}>Current pricing model</div>
          </div>
          <div
            style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 12 }}
            className="p-4 text-center"
          >
            <div className="text-2xl font-extrabold text-white">~$1B</div>
            <div className="text-xs text-gray-400 mt-1">Annual TAM @ $100/student</div>
            <div className="text-xs mt-1" style={{ color: "#22d3ee" }}>Expansion pricing tier</div>
          </div>
          <div
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
            className="p-4 text-center"
          >
            <div className="text-2xl font-extrabold text-white">$1B+</div>
            <div className="text-xs text-gray-400 mt-1">Upside potential</div>
            <div className="text-xs text-gray-500 mt-1">Enterprise institution-wide pricing</div>
          </div>
        </div>
      </div>

      {/* Grand Total Banner */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <div className="text-xs uppercase tracking-widest text-indigo-400 mb-3 font-medium">
          Combined TAM — All U.S. Private Education
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <div className="text-4xl font-extrabold text-white">$427B+</div>
            <div className="text-xs text-gray-500 mt-1">total annual revenue</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white">33,750+</div>
            <div className="text-xs text-gray-500 mt-1">institutions</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white">10M+</div>
            <div className="text-xs text-gray-500 mt-1">total students</div>
          </div>
        </div>
        <BarVisualization />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="K-12 Private Schools" value={TAMData.totalMarket.totalK12Schools} note="NCES 2021–22" />
        <StatCard label="K-12 Revenue" value={TAMData.totalMarket.totalK12Revenue} note="IBISWorld 2025" />
        <StatCard label="Private Universities" value={TAMData.totalMarket.totalUniversities} note="nonprofit + for-profit" />
        <StatCard label="University Revenue" value={TAMData.totalMarket.totalUnivRevenue} note="NCES IPEDS 2024" />
      </div>

      {/* Segments */}
      <div>
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-medium">Segment Breakdown</div>
        <div className="space-y-3">
          {TAMData.segments.map((seg) => (
            <SegmentCard
              key={seg.id}
              segment={seg}
              isExpanded={expandedSegment === seg.id}
              onClick={() => setExpandedSegment(expandedSegment === seg.id ? null : seg.id)}
            />
          ))}
        </div>
      </div>

      {/* Growth Drivers */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-xs uppercase tracking-widest text-emerald-400 mb-4 font-medium">
          Growth Catalysts & Tailwinds
        </div>
        <div className="space-y-3">
          {TAMData.growth.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-gray-400 text-sm flex-1 mr-4">{item.label}</span>
              <span className="text-emerald-400 font-bold text-sm whitespace-nowrap">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-medium">Sources</div>
        <div className="text-xs text-gray-400 space-y-1">
          <p>NCES Private School Universe Survey (PSS) 2021–22 · NCES Digest of Education Statistics 2023</p>
          <p>IBISWorld Private Schools Industry Report 2025 · IBISWorld Colleges & Universities 2025</p>
          <p>College Board Trends in College Pricing 2025 · NAICU Key Facts 2023</p>
          <p>PrivateSchoolReview.com 2025–26 Tuition Data · Council for American Private Education (CAPE)</p>
          <p>EdChoice School Choice Data · NCES IPEDS Finance Component 2024</p>
          <p>MDR Education School Counts · Research.com Education Statistics 2025–26</p>
        </div>
        <p className="mt-3 text-xs text-gray-300 leading-relaxed">
          <strong className="text-gray-400">Methodology:</strong> K-12 segment revenue estimates calculated from enrollment × average tuition by level. University revenue from NCES IPEDS institutional reporting. Institution counts from NCES PSS and IPEDS. Some segments use estimated breakdowns from combined NCES categories. All figures represent most recent available data (2021–22 school year for counts; 2024–25 or 2025–26 for tuition/revenue).
        </p>
      </div>
    </div>
  );
}
