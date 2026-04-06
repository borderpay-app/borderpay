import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Scene1Opening } from "./scenes/Scene1";
import { Scene2Problem } from "./scenes/Scene2";
import { Scene3Solution } from "./scenes/Scene3";
import { Scene3bStablecoinBenefits } from "./scenes/Scene3b";
import { Scene4HowItWorks } from "./scenes/Scene4";
import { Scene5Close } from "./scenes/Scene5";
import { PersistentBackground } from "./components/PersistentBackground";

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene1Opening />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={160}>
          <Scene2Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={160}>
          <Scene3Solution />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene3bStablecoinBenefits />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={170}>
          <Scene4HowItWorks />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene5Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
