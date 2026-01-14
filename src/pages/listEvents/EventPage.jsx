import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { listMarketCatalogue, startBot } from "../../services/api";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectMarkets,
  selectSelectedMarketId,
  setMarkets,
  setSelectedMarket,
} from "../../store/slices/marketSlice";

const EventPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const match = location.state?.eventData;
  const token = useSelector(selectToken);
  const markets = useAppSelector(selectMarkets);
  const selectedMarketId = useAppSelector(selectSelectedMarketId);

  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [marketsError, setMarketsError] = useState(null);
  const [botStarting, setBotStarting] = useState(false);
  const [botError, setBotError] = useState(null);

  // Redirect to listEvents if no event data
  if (!match) {
    navigate("/listEvents", { replace: true });
    return null;
  }

  const ev = match?.event || match;
  const startDate = ev.openDate ? new Date(ev.openDate) : null;

  useEffect(() => {
    let isMounted = true;

    const fetchMarkets = async () => {
      if (!ev?.id) return;
      setLoadingMarkets(true);
      setMarketsError(null);
      try {
        const data = await listMarketCatalogue({
          token,
          eventId: ev.id,
        });

        const list = Array.isArray(data) ? data : [];

        // Map to only the needed fields for Redux: marketId, marketName, runners.selectionId[]
        const simplified = list.map((m) => ({
          marketId: m.marketId,
          marketName: m.marketName,
          runnerSelectionIds: Array.isArray(m.runners)
            ? m.runners.map((r) => r.selectionId)
            : [],
        }));

        if (isMounted) {
          dispatch(setMarkets(simplified));
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err?.response?.data?.error?.error ||
            err?.response?.data?.error ||
            err.message ||
            "Failed to load markets";
          setMarketsError(msg);
        }
      } finally {
        if (isMounted) {
          setLoadingMarkets(false);
        }
      }
    };

    fetchMarkets();

    return () => {
      isMounted = false;
    };
  }, [dispatch, ev?.id, token]);

  const handleMarketClick = (marketId) => {
    dispatch(setSelectedMarket(marketId));
    setBotError(null);
  };

  const handleStartBot = async () => {
    if (!selectedMarketId) return;
    setBotStarting(true);
    setBotError(null);
    try {
      await startBot({ token, marketId: selectedMarketId });
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Failed to start bot";
      setBotError(msg);
    } finally {
      setBotStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-5xl">
        {/* Back button */}
        <button
          onClick={() => navigate("/listEvents")}
          className="mb-6 text-sm text-slate-300 hover:text-white transition flex items-center gap-2"
        >
          <span>←</span> Back to Events
        </button>

        {/* Event + Markets layout */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)]">
          {/* Event Details Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-md">
          {/* Event Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {ev?.name || "Event"}
          </h1>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-slate-300">
                <span className="font-semibold text-slate-200">Event ID: </span>
                <span className="font-mono break-all">{ev.id || "-"}</span>
              </div>
              <div className="text-slate-300">
                <span className="font-semibold text-slate-200">Country: </span>
                {ev.countryCode || "N/A"}
              </div>
              <div className="text-slate-300">
                <span className="font-semibold text-slate-200">Timezone: </span>
                {ev.timezone || "N/A"}
              </div>
              <div className="text-slate-300">
                <span className="font-semibold text-slate-200">Markets: </span>
                {match.marketCount ?? "-"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-amber-200 mt-1">
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
          </div>
        </div>

          {/* Markets list from market catalogue */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-md max-h-[70vh] md:max-h-[75vh] overflow-y-auto flex flex-col">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              Markets
            </h2>

          {loadingMarkets && (
            <div className="text-sm text-slate-300">Loading markets…</div>
          )}

            {marketsError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs sm:text-sm text-rose-800">
                {marketsError}
              </div>
            )}

            {botError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs sm:text-sm text-rose-800">
                {botError}
              </div>
            )}

            {!loadingMarkets && !marketsError && markets.length === 0 && (
              <div className="text-sm text-slate-300">No markets found.</div>
            )}

            <ul className="space-y-2 mt-1">
              {markets.map((m) => (
                <li key={m.marketId}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarketClick(m.marketId)}
                      className={`flex-1 text-left px-3 py-2 rounded-lg text-xs sm:text-sm transition border ${
                        selectedMarketId === m.marketId
                          ? "bg-amber-500/20 border-amber-400 text-amber-100"
                          : "bg-white/5 border-white/10 text-slate-100 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      {m.marketName || m.marketId}
                    </button>
                    {selectedMarketId === m.marketId && (
                      <button
                        type="button"
                        onClick={handleStartBot}
                        disabled={botStarting}
                        className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border whitespace-nowrap transition ${
                          botStarting
                            ? "bg-amber-300 border-amber-200 text-white cursor-wait"
                            : "bg-amber-500 hover:bg-amber-400 text-white border-amber-300"
                        }`}
                      >
                        {botStarting ? "Starting..." : "Start Bot"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPage;