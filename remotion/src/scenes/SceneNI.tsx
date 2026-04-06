import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const points = [
  {
    emoji: "🇪🇺",
    title: "EU Single Market Access",
    desc: "Under the Windsor Framework, Northern Ireland remains in the EU single market for goods — unique in the UK.",
  },
  {
    emoji: "🇬🇧",
    title: "UK Market Access",
    desc: "NI businesses also have full access to the UK internal market — the best of both worlds.",
  },
  {
    emoji: "💷💶",
    title: "Dual-Currency Corridor",
    desc: "Businesses here trade daily in both GBP and EUR — creating massive demand for fast, cheap FX.",
  },
  {
    emoji: "📦",
    title: "£12.4B Cross-Border Trade",
    desc: "Over twelve billion pounds flows across the NI–Ireland border every year — and growing.",
  },
];

export const SceneNI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const headingY = interpolate(spring({ frame, fps, config: { damping: 25 } }), [0, 1], [50, 0]);

  // Map animation
  const mapOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const mapScale = spring({ frame: frame - 10, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ fontFamily, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 80, alignItems: "flex-start", maxWidth: 1600, padding: "0 80px" }}>
        {/* Left: heading + map visualization */}
        <div style={{ flex: "0 0 500px" }}>
          <div style={{ opacity: headingOpacity, transform: `translateY(${headingY}px)` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(40, 80%, 55%)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
              WHY NORTHERN IRELAND?
            </div>
            <div style={{ fontSize: 44, fontWeight: 700, color: "hsl(40, 20%, 96%)", lineHeight: 1.2 }}>
              The perfect place
              <br />for <span style={{ color: "hsl(150, 60%, 55%)" }}>BorderPay</span>
            </div>
          </div>

          {/* Visual: dual-access badge */}
          <div
            style={{
              marginTop: 40,
              opacity: mapOpacity,
              transform: `scale(${mapScale})`,
              background: "hsla(0, 0%, 100%, 0.05)",
              border: "1px solid hsla(0, 0%, 100%, 0.1)",
              borderRadius: 20,
              padding: "30px 36px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 48 }}>🇬🇧</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, hsl(0, 70%, 50%), hsl(220, 70%, 50%))", borderRadius: 2 }} />
                <div style={{ fontSize: 11, color: "hsla(40, 20%, 96%, 0.4)", marginTop: 4, fontFamily: monoFamily }}>WINDSOR FRAMEWORK</div>
              </div>
              <div style={{ fontSize: 48 }}>🇪🇺</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "hsl(40, 20%, 96%)" }}>Northern Ireland</div>
              <div style={{ fontSize: 14, color: "hsla(40, 20%, 96%, 0.5)", marginTop: 4 }}>
                In the EU single market for goods
                <br />+ full UK market access
              </div>
            </div>
          </div>
        </div>

        {/* Right: points */}
        <div style={{ flex: 1 }}>
          {points.map((p, i) => {
            const delay = 30 + i * 20;
            const cardOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
            const cardX = interpolate(spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 200 } }), [0, 1], [50, 0]);

            return (
              <div
                key={p.title}
                style={{
                  opacity: cardOpacity,
                  transform: `translateX(${cardX}px)`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 18,
                  marginBottom: 24,
                  background: "hsla(0, 0%, 100%, 0.04)",
                  border: "1px solid hsla(0, 0%, 100%, 0.08)",
                  borderRadius: 16,
                  padding: "22px 28px",
                }}
              >
                <div style={{ fontSize: 32, flexShrink: 0, marginTop: 2 }}>{p.emoji}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "hsl(40, 20%, 96%)", marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 15, color: "hsla(40, 20%, 96%, 0.55)", lineHeight: 1.5 }}>{p.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
