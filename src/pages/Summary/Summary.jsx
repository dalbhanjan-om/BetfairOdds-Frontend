import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { getSummary } from "../../services/api";

const Summary = () => {
  const token = useSelector(selectToken);
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayString = formatDate(new Date());

  const [stats, setStats] = useState({
    totalBets: 0,
    betsWon: 0,
    betsLost: 0,
    winPercentage: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState("2026-01-18");
  const [toDate, setToDate] = useState(() => formatDate(new Date()));

  const buildToIso = (targetDate) => {
    const safeDate = targetDate > todayString ? todayString : targetDate;
    const isToday = safeDate === todayString;
    if (isToday) return new Date().toISOString();
    return new Date(`${safeDate}T23:59:59.999Z`).toISOString();
  };

  const fetchSummary = async (opts) => {
    const { from, to } = opts;
    try {
      setLoading(true);
      setError(null);

      const data = await getSummary({ token, from, to });
      const totalBets = data.totalBets || 0;
      const betsWon = data.betsWon || 0;
      const betsLost = data.betsLost || 0;
      const winPercentage =
        totalBets > 0 ? Number(((betsWon / totalBets) * 100).toFixed(2)) : 0;

      setStats({
        totalBets,
        betsWon,
        betsLost,
        winPercentage,
      });
    } catch (err) {
      setError(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!fromDate || !toDate) {
      setError("Please select both From and To dates.");
      return;
    }

    const safeToDate = toDate > todayString ? todayString : toDate;
    if (fromDate > safeToDate) {
      setError("From date cannot be after To date.");
      return;
    }

    const fromIso = `${fromDate}T00:00:00.000Z`;
    const toIso = buildToIso(safeToDate);

    fetchSummary({ from: fromIso, to: toIso });
  };

  useEffect(() => {
    const initialFrom = `${fromDate}T00:00:00.000Z`;
    const initialTo = buildToIso(toDate);
    fetchSummary({ from: initialFrom, to: initialTo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Betting Summary
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Aggregate performance based on settled bets (size 1.0).
            </p>
          </div>

          <div className="flex flex-row flex-wrap gap-3 items-end justify-center sm:justify-start">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-200 mb-1">
                From
              </label>
              <input
                type="date"
                className="rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                value={fromDate}
                max={todayString}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-200 mb-1">
                To
              </label>
              <input
                type="date"
                className="rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                value={toDate}
                max={todayString}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleApply}
              className="mt-0 inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-amber-400 hover:shadow-amber-500/30 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Loading..." : "Apply"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((key) => (
              <div
                key={key}
                className="h-28 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5/5 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-md flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Total Bets
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {stats.totalBets}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 shadow-md flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  Bets Won
                </div>
                <div className="mt-2 text-3xl font-bold text-emerald-200">
                  {stats.betsWon}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 shadow-md flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="text-xs font-semibold uppercase tracking-wide text-rose-100">
                  Bets Lost
                </div>
                <div className="mt-2 text-3xl font-bold text-rose-200">
                  {stats.betsLost}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 shadow-md flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-100">
                  Win %
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-amber-100">
                    {stats.winPercentage}
                  </span>
                  <span className="text-sm text-amber-200">%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;