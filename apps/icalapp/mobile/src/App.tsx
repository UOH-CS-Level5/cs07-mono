import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Screen = "import" | "calendar";
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

type CalendarDay = {
  key: string;
  dayNumber: string;
  weekday: string;
  month: string;
  fullLabel: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const dayNumberFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit" });
const weekdayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short" });
const dayHeaderFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const monthTitleFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});
const timeRangeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function App() {
  const [screen, setScreen] = useState<Screen>("import");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState("");

  const [icalUrl, setIcalUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("Manual Entry");
  const [manualDate, setManualDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");

  const [isImporting, setIsImporting] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => events.filter((event) => !event.isCancelled).length,
    [events],
  );

  const sortedEvents = useMemo(
    () => [...events].sort((left, right) => left.startIso.localeCompare(right.startIso) || left.id - right.id),
    [events],
  );

  const calendarDays = useMemo(() => {
    const uniqueDays = new Map<string, CalendarDay>();

    for (const event of sortedEvents) {
      const startDate = new Date(event.startIso);
      const key = getLocalDateKey(startDate);

      if (!uniqueDays.has(key)) {
        uniqueDays.set(key, {
          key,
          dayNumber: dayNumberFormatter.format(startDate),
          weekday: weekdayFormatter.format(startDate),
          month: monthFormatter.format(startDate),
          fullLabel: dayHeaderFormatter.format(startDate),
        });
      }
    }

    return Array.from(uniqueDays.values());
  }, [sortedEvents]);

  const selectedDay = useMemo(
    () => calendarDays.find((day) => day.key === selectedDateKey) ?? calendarDays[0] ?? null,
    [calendarDays, selectedDateKey],
  );

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) {
      return [];
    }

    return sortedEvents.filter((event) => getLocalDateKey(new Date(event.startIso)) === selectedDay.key);
  }, [selectedDay, sortedEvents]);

  const selectedMonthLabel = useMemo(() => {
    if (!selectedDayEvents[0]) {
      return "Upcoming schedule";
    }

    return monthTitleFormatter.format(new Date(selectedDayEvents[0].startIso));
  }, [selectedDayEvents]);

  useEffect(() => {
    if (calendarDays.length === 0) {
      setSelectedDateKey("");
      return;
    }

    setSelectedDateKey((currentValue) => {
      if (calendarDays.some((day) => day.key === currentValue)) {
        return currentValue;
      }

      return calendarDays[0].key;
    });
  }, [calendarDays]);

  const handleIcalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!icalUrl.trim()) {
      setError("Paste your iCal link first.");
      return;
    }

    try {
      setIsImporting(true);
      setError("");

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
      setScreen("calendar");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not import iCal link.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!manualDate || !manualStartTime || !manualEndTime) {
      setError("Add date, start time, and end time before submitting manual entry.");
      return;
    }

    try {
      setIsSavingManual(true);
      setError("");

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
      setScreen("calendar");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not save manual event.",
      );
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <main className="app-shell">
      {screen === "import" ? (
        <section className="phone-screen import-screen" data-name="phone" data-node-id="45:258">
          <div className="shape shape-top-right" aria-hidden="true" />
          <div className="shape shape-bottom-left" aria-hidden="true" />

          <header className="hero-block">
            <div className="hero-badge" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className="hero-kicker">Semester Planner</p>
            <h1>Import Timetable</h1>
            <p className="hero-copy">Paste your iCal link or add a manual event.</p>
          </header>

          <section className="surface-panel">
            <form className="form-block" onSubmit={handleIcalSubmit}>
              <h2>Import via iCal</h2>
              <label className="line-input">
                <span>iCal Link</span>
                <input
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
              <h2>Manual entry</h2>
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

              <button className="action-button secondary" type="submit" disabled={isSavingManual}>
                {isSavingManual ? "Saving..." : "Add manual event"}
              </button>
            </form>

            {error ? <p className="error-banner">{error}</p> : null}
          </section>
        </section>
      ) : (
        <section className="phone-screen calendar-screen">
          <div className="shape shape-top-right calendar-shape-top-right" aria-hidden="true" />
          <div className="shape shape-bottom-left calendar-shape-bottom-left" aria-hidden="true" />

          <header className="calendar-header">
            <div>
              <p className="calendar-kicker">Upcoming schedule</p>
              <h2>{selectedMonthLabel}</h2>
              <p className="calendar-subcopy">
                {activeCount} active events across {calendarDays.length} days
              </p>
            </div>
            <button className="calendar-back" type="button" onClick={() => setScreen("import")}>
              Edit import
            </button>
          </header>

          <div className="calendar-panel" data-node-id="45:406">
            {events.length === 0 ? (
              <p className="calendar-empty">No events imported yet.</p>
            ) : (
              <>
                <div className="calendar-day-strip" role="tablist" aria-label="Calendar days">
                  {calendarDays.map((day) => {
                    const isSelected = day.key === selectedDay?.key;

                    return (
                      <button
                        key={day.key}
                        className={`calendar-day-chip ${isSelected ? "is-selected" : ""}`}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setSelectedDateKey(day.key)}
                      >
                        <span className="day-chip-weekday">{day.weekday}</span>
                        <span className="day-chip-number">{day.dayNumber}</span>
                        <span className="day-chip-month">{day.month}</span>
                      </button>
                    );
                  })}
                </div>

                <section className="agenda-surface">
                  <header className="agenda-header">
                    <div>
                      <p className="agenda-kicker">Selected day</p>
                      <h3>{selectedDay?.fullLabel ?? "Upcoming events"}</h3>
                    </div>
                    <p className="agenda-count">
                      {selectedDayEvents.length} {selectedDayEvents.length === 1 ? "event" : "events"}
                    </p>
                  </header>

                  {selectedDayEvents.length === 0 ? (
                    <p className="calendar-empty">No events scheduled for this day.</p>
                  ) : (
                    <div className="agenda-list">
                      {selectedDayEvents.map((eventRecord) => (
                        <article
                          className={`agenda-event ${eventRecord.isCancelled ? "is-cancelled" : ""}`}
                          key={`${eventRecord.id}-${eventRecord.startIso}`}
                        >
                          <div className="agenda-time">
                            <p className="agenda-time-range">
                              {formatTimeRange(eventRecord.startIso, eventRecord.endIso)}
                            </p>
                            <p className="agenda-time-label">
                              {eventRecord.sourceType === "manual" ? "Manual" : "Imported"}
                            </p>
                          </div>

                          <div className="agenda-card">
                            <div className="agenda-card-top">
                              <h4 className="agenda-event-title">{eventRecord.title}</h4>
                              {eventRecord.isCancelled ? (
                                <span className="event-pill">Cancelled</span>
                              ) : null}
                            </div>

                            {eventRecord.location ? (
                              <p className="agenda-location">{eventRecord.location}</p>
                            ) : null}

                            {eventRecord.description && eventRecord.description !== "Created manually" ? (
                              <p className="agenda-description">{eventRecord.description}</p>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </section>
      )}
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

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeRange(startIso: string, endIso: string): string {
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Time unavailable";
  }

  const startLabel = timeRangeFormatter.format(startDate);
  const endLabel = timeRangeFormatter.format(endDate);
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}
