import { useEffect, useMemo, useRef, useState } from "react";
import type { AnimationEvent } from "react";
import { toFacehashSvgDataUri } from "./lib/facehash";
import "./App.css";

type OnboardingScreen = "welcome" | "identity";
type TransitionDirection = "forward" | "backward";

type ScreenTransition = {
  from: OnboardingScreen;
  to: OnboardingScreen;
  direction: TransitionDirection;
};

function App() {
  const [screen, setScreen] = useState<OnboardingScreen>("welcome");
  const [transition, setTransition] = useState<ScreenTransition | null>(null);
  const [name, setName] = useState("");
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedName = name.trim() || "Guest";
  const isAnimating = transition !== null;

  const avatarUri = useMemo(
    () =>
      toFacehashSvgDataUri({
        name: normalizedName,
        size: 280,
        variant: "gradient",
        showInitial: true,
        colors: ["#ff383c", "#ef4444", "#f97316", "#ff6b6f", "#f59e0b"],
        foregroundColor: "#100102",
        fontFamily: "Outfit, sans-serif",
      }),
    [normalizedName],
  );

  const visibleScreens = transition ? [transition.from, transition.to] : [screen];

  useEffect(() => {
    if (screen === "identity" && !isAnimating) {
      nameInputRef.current?.focus();
    }
  }, [isAnimating, screen]);

  const navigateTo = (next: OnboardingScreen) => {
    if (isAnimating || next === screen) {
      return;
    }

    setTransition({
      from: screen,
      to: next,
      direction: next === "identity" ? "forward" : "backward",
    });
  };

  const handleEnterAnimationEnd = (event: AnimationEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || !transition) {
      return;
    }

    setScreen(transition.to);
    setTransition(null);
  };

  const getMotionClassName = (visibleScreen: OnboardingScreen) => {
    if (!transition) {
      return "";
    }

    if (visibleScreen === transition.from) {
      return transition.direction === "forward" ? "screen-exit-forward" : "screen-exit-backward";
    }

    return transition.direction === "forward" ? "screen-enter-forward" : "screen-enter-backward";
  };

  return (
    <main className={`onboard-shell ${isAnimating ? "is-transitioning" : ""}`} data-screen={screen}>
      <div className="screen-stage">
        {visibleScreens.map((visibleScreen, index) => {
          const isEnteringScreen = transition ? visibleScreen === transition.to : false;
          const key = transition
            ? `${visibleScreen}-${isEnteringScreen ? "enter" : "exit"}`
            : visibleScreen;

          return (
            <section
              key={key}
              className={`phone-screen ${visibleScreen}-screen ${isAnimating ? "screen-layer" : ""} ${getMotionClassName(visibleScreen)}`}
              onAnimationEnd={isEnteringScreen ? handleEnterAnimationEnd : undefined}
              style={isAnimating ? { zIndex: index + 1 } : undefined}
            >
              <div className="shape shape-top-right" aria-hidden="true" />
              <div className="shape shape-bottom-left" aria-hidden="true" />

              {visibleScreen === "welcome" ? (
                <>
                  <header className="hero-block">
                    <p className="hero-kicker">Onboarding</p>
                    <h1>Raise The Scales</h1>
                    <p className="hero-copy">
                      Create your placeholder identity in one quick step.
                    </p>
                  </header>

                  <div className="dragon-image-wrap">
                    <img src="/dragon-20-137.png" alt="Dragon mascot" />
                  </div>

                  <button
                    className="action-pill"
                    type="button"
                    disabled={isAnimating}
                    onClick={() => navigateTo("identity")}
                  >
                    Get Started
                  </button>
                </>
              ) : (
                <>
                  <header className="identity-header">
                    <button
                      className="ghost-back"
                      type="button"
                      disabled={isAnimating}
                      onClick={() => navigateTo("welcome")}
                    >
                      Back
                    </button>
                    <p className="hero-kicker">Step 1 of 1</p>
                    <h2>What is your name?</h2>
                    <p className="hero-copy">Your placeholder portrait updates while you type.</p>
                  </header>

                  <div className="avatar-panel">
                    <img src={avatarUri} alt={`Generated placeholder avatar for ${normalizedName}`} />
                    <p>{normalizedName}</p>
                  </div>

                  <label className="line-input" htmlFor="name-input">
                    <span>Name</span>
                    <input
                      id="name-input"
                      ref={nameInputRef}
                      value={name}
                      onChange={(eventTarget) => setName(eventTarget.target.value)}
                      placeholder="Type your name"
                      autoComplete="name"
                      autoCapitalize="words"
                      autoCorrect="off"
                    />
                  </label>
                </>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

export default App;
