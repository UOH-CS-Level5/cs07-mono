import { useEffect, useMemo, useRef, useState } from "react";
import type { AnimationEvent, FormEvent } from "react";
import { authClient } from "./lib/auth-client";
import { toFacehashSvgDataUri } from "./lib/facehash";
import "./App.css";

type OnboardingScreen = "welcome" | "identity" | "timetable" | "auth";
type TransitionDirection = "forward" | "backward";
type SourceType = "ical" | "manual";

type CalendarEvent = {
  id: number;
  importId: number | null;
  sourceType: SourceType;
  uid: string | null;
  title: string;
  startIso: string;
  endIso: string;
  location: string;
  description: string;
  isCancelled: boolean;
  dateLabel: string;
  timeLabel: string;
};

type EventApiResponse = {
  count: number;
  events: CalendarEvent[];
  message?: string;
};

type ScreenTransition = {
  from: OnboardingScreen;
  to: OnboardingScreen;
  direction: TransitionDirection;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const SCREEN_ORDER: OnboardingScreen[] = ["welcome", "identity", "timetable", "auth"];

function App() {
  const [screen, setScreen] = useState<OnboardingScreen>("welcome");
  const [transition, setTransition] = useState<ScreenTransition | null>(null);

  const [name, setName] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [icalUrl, setIcalUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("Manual Entry");
  const [manualDate, setManualDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");

  const [isImporting, setIsImporting] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [importError, setImportError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const icalInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedName = name.trim() || "Guest";
  const isAnimating = transition !== null;
  const hasImportedTimetable = events.length > 0;

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

    if (screen === "timetable" && !isAnimating) {
      icalInputRef.current?.focus();
    }

    if (screen === "auth" && !isAnimating) {
      emailInputRef.current?.focus();
    }
  }, [isAnimating, screen]);

  const navigateTo = (next: OnboardingScreen) => {
    if (isAnimating || next === screen) {
      return;
    }

    const currentIndex = SCREEN_ORDER.indexOf(screen);
    const nextIndex = SCREEN_ORDER.indexOf(next);

    setTransition({
      from: screen,
      to: next,
      direction: nextIndex > currentIndex ? "forward" : "backward",
    });
  };

  const handleIcalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!icalUrl.trim()) {
      setImportError("Paste your iCal link first.");
      return;
    }

    try {
      setIsImporting(true);
      setImportError("");

      const response = await fetch(`${API_BASE_URL}/api/import/ical`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: icalUrl.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await getRequestError(response));
      }

      const payload = (await response.json()) as EventApiResponse;
      setEvents(payload.events);
    } catch (requestError) {
      setImportError(
        requestError instanceof Error ? requestError.message : "Could not import iCal link.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!manualDate || !manualStartTime || !manualEndTime) {
      setImportError("Add date, start time, and end time before submitting manual entry.");
      return;
    }

    try {
      setIsSavingManual(true);
      setImportError("");

      const response = await fetch(`${API_BASE_URL}/api/events/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: manualTitle.trim() || "Manual Entry",
          date: manualDate.trim(),
          startTime: manualStartTime.trim(),
          endTime: manualEndTime.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await getRequestError(response));
      }

      const payload = (await response.json()) as EventApiResponse;
      setEvents(payload.events);
    } catch (requestError) {
      setImportError(requestError instanceof Error ? requestError.message : "Could not save manual event.");
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setAuthError("Add your email and password to finish onboarding.");
      return;
    }

    setAuthSuccess("");
    setAuthError("");

    try {
      setIsCreatingAccount(true);

      const result = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: normalizedName,
      });

      if (result.error) {
        throw new Error(result.error.message || "Could not create account.");
      }

      setAuthSuccess("Your account is ready. Onboarding complete.");
    } catch (signupError) {
      setAuthError(signupError instanceof Error ? signupError.message : "Could not create account.");
    } finally {
      setIsCreatingAccount(false);
    }
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
              ) : visibleScreen === "identity" ? (
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
                    <p className="hero-kicker">Step 1 of 3</p>
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

                  <button
                    className="action-pill compact"
                    type="button"
                    disabled={isAnimating}
                    onClick={() => navigateTo("timetable")}
                  >
                    Continue
                  </button>
                </>
              ) : visibleScreen === "timetable" ? (
                <>
                  <header className="identity-header">
                    <button
                      className="ghost-back"
                      type="button"
                      disabled={isAnimating || isImporting || isSavingManual}
                      onClick={() => navigateTo("identity")}
                    >
                      Back
                    </button>
                    <p className="hero-kicker">Step 2 of 3</p>
                    <h2>Import your timetable</h2>
                    <p className="hero-copy">Paste your iCal link or add a manual event.</p>
                  </header>

                  <section className="surface-panel">
                    <form className="form-block" onSubmit={handleIcalSubmit}>
                      <h3>Import via iCal</h3>
                      <label className="line-input">
                        <span>iCal Link</span>
                        <input
                          ref={icalInputRef}
                          type="url"
                          value={icalUrl}
                          onChange={(eventTarget) => setIcalUrl(eventTarget.target.value)}
                          placeholder="https://example.com/timetable.ics"
                          autoCapitalize="off"
                          autoCorrect="off"
                        />
                      </label>
                      <button className="action-button primary" type="submit" disabled={isImporting}>
                        {isImporting ? "Importing..." : "Import timetable"}
                      </button>
                    </form>

                    <div className="divider-line" aria-hidden="true">
                      <span>or</span>
                    </div>

                    <form className="form-block" onSubmit={handleManualSubmit}>
                      <h3>Manual entry</h3>
                      <label className="line-input">
                        <span>Event title</span>
                        <input
                          type="text"
                          value={manualTitle}
                          onChange={(eventTarget) => setManualTitle(eventTarget.target.value)}
                          placeholder="Seminar"
                        />
                      </label>

                      <label className="line-input">
                        <span>Date</span>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(eventTarget) => setManualDate(eventTarget.target.value)}
                        />
                      </label>

                      <div className="time-row">
                        <label className="line-input compact">
                          <span>Start</span>
                          <input
                            type="time"
                            value={manualStartTime}
                            onChange={(eventTarget) => setManualStartTime(eventTarget.target.value)}
                          />
                        </label>

                        <label className="line-input compact">
                          <span>End</span>
                          <input
                            type="time"
                            value={manualEndTime}
                            onChange={(eventTarget) => setManualEndTime(eventTarget.target.value)}
                          />
                        </label>
                      </div>

                      <button
                        className="action-button secondary"
                        type="submit"
                        disabled={isSavingManual}
                      >
                        {isSavingManual ? "Saving..." : "Add manual event"}
                      </button>
                    </form>

                    {importError ? <p className="error-banner">{importError}</p> : null}
                  </section>

                  <section className="event-preview-panel" aria-live="polite">
                    {hasImportedTimetable ? (
                      <>
                        <p className="event-preview-kicker">Imported schedule</p>
                        <p className="event-preview-count">
                          {events.filter((eventItem) => !eventItem.isCancelled).length} active events ready
                        </p>
                      </>
                    ) : (
                      <p className="event-preview-empty">Import at least one event to continue.</p>
                    )}
                  </section>

                  <button
                    className="action-pill compact"
                    type="button"
                    disabled={isAnimating || !hasImportedTimetable || isImporting || isSavingManual}
                    onClick={() => navigateTo("auth")}
                  >
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <header className="identity-header">
                    <button
                      className="ghost-back"
                      type="button"
                      disabled={isAnimating || isCreatingAccount}
                      onClick={() => navigateTo("timetable")}
                    >
                      Back
                    </button>
                    <p className="hero-kicker">Step 3 of 3</p>
                    <h2>A few more details</h2>
                    <p className="hero-copy">Create your account to finish setup.</p>
                  </header>

                  <form className="surface-panel auth-form" onSubmit={handleCreateAccount}>
                    <label className="line-input">
                      <span>Email address</span>
                      <input
                        ref={emailInputRef}
                        type="email"
                        value={email}
                        onChange={(eventTarget) => setEmail(eventTarget.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </label>

                    <label className="line-input">
                      <span>Password</span>
                      <input
                        type="password"
                        value={password}
                        onChange={(eventTarget) => setPassword(eventTarget.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                    </label>

                    <button className="action-button primary" type="submit" disabled={isCreatingAccount}>
                      {isCreatingAccount ? "Creating account..." : "Create account"}
                    </button>

                    {authError ? <p className="error-banner">{authError}</p> : null}
                    {authSuccess ? <p className="success-banner">{authSuccess}</p> : null}
                  </form>
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

async function getRequestError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      return body.message;
    }
  } catch {
    return `Request failed (${response.status}).`;
  }

  return `Request failed (${response.status}).`;
}
