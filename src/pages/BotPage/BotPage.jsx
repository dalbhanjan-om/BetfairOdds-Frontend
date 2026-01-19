import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { getBotStatus, stopBot } from "../../services/api";

export default function BotPage() {
  const token = useSelector(selectToken);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stoppingMarketId, setStoppingMarketId] = useState(null);
  const [activeBots, setActiveBots] = useState({}); // { [marketId]: { running: true, config: { size, upThreshold, downThreshold } } }

  useEffect(() => {
    let alive = true;

    const fetchStatus = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const status = await getBotStatus({ token });
        if (!alive) return;

        // New shape: { activeBots, activeMarkets, count }
        if (status?.activeBots && typeof status.activeBots === "object") {
          setActiveBots(status.activeBots);
        } else {
          // Backward compatible fallback: { activeMarkets: [] }
          const markets = Array.isArray(status?.activeMarkets)
            ? status.activeMarkets
            : [];
          const fallback = {};
          for (const marketId of markets) {
            fallback[marketId] = { running: true, config: null };
          }
          setActiveBots(fallback);
        }
      } catch (err) {
        if (!alive) return;
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load running bots";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [token]);

  const botList = useMemo(() => {
    const entries = Object.entries(activeBots || {});
    entries.sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([marketId, info]) => ({
      marketId,
      running: !!info?.running,
      config: info?.config || null,
    }));
  }, [activeBots]);

  const handleStop = async (marketId) => {
    if (!marketId) return;
    setStoppingMarketId(marketId);
    setError(null);
    try {
      await stopBot({ token, marketId });
      setActiveBots((prev) => {
        const next = { ...(prev || {}) };
        delete next[marketId];
        return next;
      });
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || "Failed to stop bot";
      setError(msg);
    } finally {
      setStoppingMarketId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Running Bots
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Live view of all active markets and their configuration.
            </p>
          </div>
          <div className="shrink-0">
            <div className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm">
              <span className="text-slate-300">Active:</span>{" "}
              <span className="font-semibold text-amber-300">
                {botList.length}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-md">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold">Bots</h2>
            {loading && (
              <div className="text-xs text-slate-300">Refreshing…</div>
            )}
          </div>

          {botList.length === 0 && !loading ? (
            <div className="text-sm text-slate-300">
              No bots running right now.
            </div>
          ) : (
            <div className="space-y-3">
              {botList.map((bot) => {
                const cfg = bot.config;
                const size = cfg?.size ?? "-";
                const up = cfg?.upThreshold ?? "-";
                const down = cfg?.downThreshold ?? "-";

                return (
                  <div
                    key={bot.marketId}
                    className="rounded-xl border border-white/10 bg-slate-950/30 p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Active
                          </span>
                          <span className="text-sm font-semibold text-white truncate">
                            {bot.marketId}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                            <div className="text-[11px] text-slate-400 font-medium">
                              Bet Size
                            </div>
                            <div className="mt-0.5 font-semibold text-amber-300">
                              £{size}
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                            <div className="text-[11px] text-slate-400 font-medium">
                              UP Threshold (BACK/UNDER)
                            </div>
                            <div className="mt-0.5 font-semibold text-green-300">
                              ≥{up}
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                            <div className="text-[11px] text-slate-400 font-medium">
                              DOWN Threshold (LAY/OVER)
                            </div>
                            <div className="mt-0.5 font-semibold text-red-300">
                              ≥{down}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleStop(bot.marketId)}
                          disabled={stoppingMarketId === bot.marketId}
                          className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all shadow-md ${
                            stoppingMarketId === bot.marketId
                              ? "bg-red-300/50 border-red-200/50 text-white/70 cursor-wait"
                              : "bg-red-500 hover:bg-red-400 text-white border-red-300 hover:shadow-lg hover:shadow-red-500/20 active:scale-95"
                          }`}
                        >
                          {stoppingMarketId === bot.marketId
                            ? "Stopping…"
                            : "Stop"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

