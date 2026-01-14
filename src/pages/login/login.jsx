import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginStart, loginSuccess, loginFailure } from "../../store/slices/authSlice";
import { selectAuthLoading, selectAuthError } from "../../store/slices/authSlice";
import { login as betfairLogin } from "../../services/api";

function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [success, setSuccess] = useState(null);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const isLoading = useSelector(selectAuthLoading);
	const error = useSelector(selectAuthError);

	const handleSubmit = async (event) => {
		event.preventDefault();
		dispatch(loginStart());
		setSuccess(null);

		try {
			const response = await betfairLogin({ username, password });
			const { token, product, error: apiError } = response || {};

			console.log("Login response:", { 
				hasToken: !!token,
				product,
				status: response?.status,
				apiError,
			});

			if (token) {
				dispatch(loginSuccess({ token }));
				setSuccess("Logged in successfully.");

				navigate("/listEvents", { replace: true });
			} else {
				throw new Error(apiError || "Login failed. Check your credentials.");
			}
		} catch (err) {
			const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Login failed.";
			console.error("Login error:", message, err);
			dispatch(loginFailure(message));
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900/40 px-4 py-12 text-slate-900">
			<div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/5 bg-white/5 p-8 shadow-2xl backdrop-blur">
				<div className="mb-8 flex flex-col items-center text-center">
					<span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 ring-1 ring-amber-400/30">
						Betfair SSO
					</span>
					<h1 className="mt-4 text-3xl font-bold text-white">Sign in securely</h1>
					<p className="mt-2 max-w-2xl text-sm text-slate-200/80">
						Use your Betfair username and password. For strong auth, append your 2FA code to your password.
					</p>
				</div>

				<form
					onSubmit={handleSubmit}
					className="mx-auto max-w-xl space-y-5 rounded-2xl border border-white/10 bg-white/90 p-8 shadow-xl"
				>
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-slate-900" htmlFor="username">
							Username
						</label>
						<input
							id="username"
							name="username"
							type="text"
							required
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
							placeholder="your.username"
							autoComplete="username"
						/>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-semibold text-slate-900" htmlFor="password">
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
							placeholder="Password or password+2FA"
							autoComplete="current-password"
						/>
						<p className="text-xs text-slate-500">
							Append your current 2FA code to the end for strong auth.
						</p>
					</div>

					{error && (
						<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
							{error}
						</div>
					)}

					{success && (
						<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
							{success}
						</div>
					)}

					<button
						type="submit"
						disabled={isLoading}
						className="flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-75"
					>
						{isLoading ? "Signing in…" : "Sign in"}
					</button>

					<p className="text-center text-xs text-slate-500">
						Session token stays on this device after a successful login.
					</p>
				</form>
			</div>
		</div>
	);
}

export default Login;
