import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { listMarketCatalogue, startBot, stopBot, getBotStatus } from "../../services/api";
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
  const [botStopping, setBotStopping] = useState(false);
  const [botError, setBotError] = useState(null);
  const [runningBots, setRunningBots] = useState(new Set()); // Track which marketIds have bots running
  const [botConfigs, setBotConfigs] = useState(new Map()); // Map<marketId, { size, upThreshold, downThreshold }>
  const [betSize, setBetSize] = useState("1"); // Default bet size
  const [upThreshold, setUpThreshold] = useState("5"); // Default: Line moves up >= 5 for BACK (UNDER) bet
  const [downThreshold, setDownThreshold] = useState("3"); // Default: Line moves down >= 3 for LAY (OVER) bet

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

    // Check bot status on mount/refresh
    const checkBotStatus = async () => {
      try {
        const status = await getBotStatus({ token });
        if (status.activeBots) {
          const marketIds = new Set();
          const configs = new Map();
          for (const [marketId, botInfo] of Object.entries(status.activeBots)) {
            marketIds.add(marketId);
            if (botInfo.config) {
              configs.set(marketId, botInfo.config);
            }
          }
          setRunningBots(marketIds);
          setBotConfigs(configs);
        } else if (status.activeMarkets && Array.isArray(status.activeMarkets)) {
          setRunningBots(new Set(status.activeMarkets));
        }
      } catch (err) {
        // Ignore errors when checking status
        console.error("Failed to check bot status:", err);
      }
    };

    checkBotStatus();

    return () => {
      isMounted = false;
    };
  }, [dispatch, ev?.id, token]);

  const handleMarketClick = (marketId) => {
    // Reset bet size and thresholds when switching markets (unless it's the same market)
    if (selectedMarketId !== marketId) {
      setBetSize("1");
      setUpThreshold("5");
      setDownThreshold("3");
    }
    dispatch(setSelectedMarket(marketId));
    setBotError(null);
  };

  const handleStartBot = async () => {
    if (!selectedMarketId) return;
    const size = parseFloat(betSize);
    const upThresh = parseFloat(upThreshold);
    const downThresh = parseFloat(downThreshold);
    
    if (isNaN(size) || size <= 0) {
      setBotError("Please enter a valid bet size (greater than 0)");
      return;
    }
    if (isNaN(upThresh) || upThresh <= 0) {
      setBotError("Please enter a valid UP threshold (greater than 0)");
      return;
    }
    if (isNaN(downThresh) || downThresh <= 0) {
      setBotError("Please enter a valid DOWN threshold (greater than 0)");
      return;
    }
    
    setBotStarting(true);
    setBotError(null);
    try {
      await startBot({ 
        token, 
        marketId: selectedMarketId, 
        size,
        upThreshold: upThresh,
        downThreshold: downThresh
      });
      // Update running bots state and store configuration
      setRunningBots((prev) => new Set([...prev, selectedMarketId]));
      setBotConfigs((prev) => {
        const next = new Map(prev);
        next.set(selectedMarketId, {
          size,
          upThreshold: upThresh,
          downThreshold: downThresh,
        });
        return next;
      });
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Failed to start bot";
      setBotError(msg);
    } finally {
      setBotStarting(false);
    }
  };

  const handleStopBot = async () => {
    if (!selectedMarketId) return;
    setBotStopping(true);
    setBotError(null);
    try {
      await stopBot({ token, marketId: selectedMarketId });
      // Remove from running bots state and config
      setRunningBots((prev) => {
        const next = new Set(prev);
        next.delete(selectedMarketId);
        return next;
      });
      setBotConfigs((prev) => {
        const next = new Map(prev);
        next.delete(selectedMarketId);
        return next;
      });
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Failed to stop bot";
      setBotError(msg);
    } finally {
      setBotStopping(false);
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
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">
                Markets
              </h2>
              {runningBots.size > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  <span>{runningBots.size} Bot{runningBots.size !== 1 ? 's' : ''} Running</span>
                </div>
              )}
            </div>

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

            <ul className="space-y-3 mt-1">
              {markets.map((m) => {
                const isBotRunning = runningBots.has(m.marketId);
                const isSelected = selectedMarketId === m.marketId;
                
                return (
                  <li key={m.marketId}>
                    <div className={`rounded-lg border transition-all ${
                      isSelected 
                        ? "border-amber-400/50 bg-amber-500/10 shadow-lg shadow-amber-500/10" 
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}>
                      <button
                        type="button"
                        onClick={() => handleMarketClick(m.marketId)}
                        className="w-full text-left px-4 py-3 rounded-lg transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className={`flex-1 text-sm sm:text-base font-medium ${
                            isSelected ? "text-amber-100" : "text-slate-100"
                          }`}>
                            {m.marketName || m.marketId}
                          </span>
                          {isBotRunning && (
                            <span
                              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30"
                              title="Bot is running"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                              Active
                            </span>
                          )}
                        </div>
                      </button>
                      
                      {isSelected && (
                        <div className="px-4 pb-4 pt-3 border-t border-white/10">
                          {!isBotRunning ? (
                            <div className="space-y-4">
                              {/* Configuration Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Bet Size */}
                                <div className="flex flex-col">
                                  <label className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    Bet Size
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={betSize}
                                      onChange={(e) => setBetSize(e.target.value)}
                                      disabled={botStarting}
                                      className="w-full px-3 py-2.5 rounded-lg text-sm bg-white/10 border border-white/20 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                      placeholder="1.00"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none font-medium">
                                      £
                                    </span>
                                  </div>
                                </div>

                                {/* UP Threshold */}
                                <div className="flex flex-col">
                                  <label className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                    UP Threshold
                                  </label>
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={upThreshold}
                                      onChange={(e) => setUpThreshold(e.target.value)}
                                      disabled={botStarting}
                                      className="w-full px-3 py-2.5 rounded-lg text-sm bg-white/10 border border-white/20 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                      placeholder="5.00"
                                    />
                                    <p className="text-[10px] text-slate-400 leading-tight">
                                      Bet BACK/UNDER when line moves up ≥ this value
                                    </p>
                                  </div>
                                </div>

                                {/* DOWN Threshold */}
                                <div className="flex flex-col">
                                  <label className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                    DOWN Threshold
                                  </label>
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={downThreshold}
                                      onChange={(e) => setDownThreshold(e.target.value)}
                                      disabled={botStarting}
                                      className="w-full px-3 py-2.5 rounded-lg text-sm bg-white/10 border border-white/20 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                      placeholder="2.00"
                                    />
                                    <p className="text-[10px] text-slate-400 leading-tight">
                                      Bet LAY/OVER when line moves down ≥ this value
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Start Bot Button */}
                              <div className="flex justify-center pt-1">
                                <button
                                  type="button"
                                  onClick={handleStartBot}
                                  disabled={
                                    botStarting || 
                                    !betSize || 
                                    parseFloat(betSize) <= 0 ||
                                    !upThreshold ||
                                    parseFloat(upThreshold) <= 0 ||
                                    !downThreshold ||
                                    parseFloat(downThreshold) <= 0
                                  }
                                  className={`px-8 py-3 rounded-lg text-sm font-semibold border transition-all shadow-md ${
                                    botStarting || 
                                    !betSize || 
                                    parseFloat(betSize) <= 0 ||
                                    !upThreshold ||
                                    parseFloat(upThreshold) <= 0 ||
                                    !downThreshold ||
                                    parseFloat(downThreshold) <= 0
                                      ? "bg-amber-300/50 border-amber-200/50 text-white/70 cursor-not-allowed"
                                      : "bg-amber-500 hover:bg-amber-400 text-white border-amber-300 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
                                  }`}
                                >
                                  {botStarting ? (
                                    <span className="flex items-center gap-2">
                                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                      Starting...
                                    </span>
                                  ) : (
                                    "Start Bot"
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex flex-col gap-2">
                                {(() => {
                                  const config = botConfigs.get(m.marketId);
                                  const displaySize = config?.size ?? betSize;
                                  const displayUp = config?.upThreshold ?? upThreshold;
                                  const displayDown = config?.downThreshold ?? downThreshold;
                                  
                                  return (
                                    <div className="flex items-center gap-3 text-sm flex-wrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-slate-400 font-medium">Size:</span>
                                        <span className="text-amber-300 font-semibold">£{displaySize}</span>
                                      </div>
                                      <span className="text-slate-600">•</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                        <span className="text-slate-400 font-medium">UP:</span>
                                        <span className="text-green-300 font-semibold">≥{displayUp}</span>
                                      </div>
                                      <span className="text-slate-600">•</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                        <span className="text-slate-400 font-medium">DOWN:</span>
                                        <span className="text-red-300 font-semibold">≥{displayDown}</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                              <button
                                type="button"
                                onClick={handleStopBot}
                                disabled={botStopping}
                                className={`px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all shadow-md ${
                                  botStopping
                                    ? "bg-red-300/50 border-red-200/50 text-white/70 cursor-wait"
                                    : "bg-red-500 hover:bg-red-400 text-white border-red-300 hover:shadow-lg hover:shadow-red-500/20 active:scale-95"
                                }`}
                              >
                                {botStopping ? (
                                  <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Stopping...
                                  </span>
                                ) : (
                                  "Stop Bot"
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPage;