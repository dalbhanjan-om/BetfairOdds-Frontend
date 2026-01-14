import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { listEvents } from "../../services/api";

const ListEvent = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const betfairToken = useSelector(selectToken);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const data = await listEvents(betfairToken);
        if (isMounted) {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.events)
            ? data.events
            : [];
          setEvents(list);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err?.response?.data?.error?.error ||
            err?.response?.data?.error ||
            err.message ||
            "Failed to load events";
          setError(errorMessage);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, [betfairToken]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Cricket Events</h1>

        {loading && <div className="text-sm text-slate-300">Loading events…</div>}

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-sm text-slate-300">No events found.</div>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const ev = event?.event || {};
            const startDate = ev.openDate ? new Date(ev.openDate) : null;
            return (
              <li
                key={ev.id}
                onClick={() => navigate("/event", { state: { eventData: event } })}
                className="rounded-xl border border-white/10 bg-white/5 p-4 shadow cursor-pointer transition hover:bg-white/10 hover:border-white/20 hover:shadow-lg"
              >
                <div className="text-lg font-semibold text-white mb-2">
                  {ev.name || "Event"}
                </div>
                <div className="text-xs text-slate-300">
                  Event ID: {ev.id || "-"}
                </div>
                <div className="text-xs text-slate-300">
                  Country: {ev.countryCode || "N/A"}
                </div>
                <div className="text-xs text-slate-300">
                  Timezone: {ev.timezone || "N/A"}
                </div>
                <div className="text-xs text-amber-200 mt-2 space-y-1">
                  <div>
                    <span className="font-semibold">Start (London): </span>
                    {startDate
                      ? startDate.toLocaleString("en-GB", {
                          timeZone: "Europe/London",
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown"}
                  </div>
                  <div>
                    <span className="font-semibold">Start (India): </span>
                    {startDate
                      ? startDate.toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown"}
                  </div>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Markets: {event.marketCount ?? "-"}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ListEvent;