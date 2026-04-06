import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export const Scene5Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const titleOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 20, fps, config: { damping: 20 } }), [0, 1], [40, 0]);

  const statsOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  const ctaOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });
  const ctaScale = spring({ frame: frame - 80, fps, config: { damping: 10 } });

  const urlOpacity = interpolate(frame, [100, 115], [0, 1], { extrapolateRight: "clamp" });

  const ctaPulse = 1 + Math.sin(frame * 0.06) * 0.02;
  const floatY = Math.sin(frame * 0.025) * 4;

  return (
    <AbsoluteFill style={{ fontFamily, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", transform: `translateY(${floatY}px)` }}>
        {/* Logo */}
        <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})`, marginBottom: 30 }}>
          <Img
            src={staticFile("images/logo.png")}
            style={{ width: 100, height: 100, objectFit: "contain", margin: "0 auto" }}
          />
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "hsl(40, 20%, 96%)",
            letterSpacing: "-2px",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Border<span style={{ color: "hsl(150, 60%, 55%)" }}>Pay</span>
        </div>

        <div
          style={{
            fontSize: 24,
            color: "hsla(40, 20%, 96%, 0.6)",
            marginTop: 12,
            opacity: titleOpacity,
          }}
        >
          The future of cross-border payments
        </div>

        {/* Key stats */}
        <div style={{ display: "flex", gap: 50, marginTop: 50, justifyContent: "center", opacity: statsOpacity }}>
          {[
            { stat: "< 30s", label: "Settlement" },
            { stat: "< 0.5%", label: "Fees" },
            { stat: "£12.4B", label: "Corridor" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: "hsl(150, 60%, 55%)" }}>{s.stat}</div>
              <div style={{ fontSize: 14, color: "hsla(40, 20%, 96%, 0.5)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 50,
            opacity: ctaOpacity,
            transform: `scale(${ctaScale * ctaPulse})`,
            display: "inline-block",
            background: "linear-gradient(135deg, hsl(150, 50%, 35%), hsl(150, 60%, 25%))",
            borderRadius: 14,
            padding: "18px 50px",
            fontSize: 20,
            fontWeight: 600,
            color: "hsl(40, 20%, 96%)",
          }}
        >
          Register Your Interest Today
        </div>

        <div
          style={{
            marginTop: 24,
            opacity: urlOpacity,
            fontSize: 18,
            color: "hsla(40, 20%, 96%, 0.4)",
            fontWeight: 400,
          }}
        >
          borderpay.app
        </div>
      </div>
    </AbsoluteFill>
  );
};
