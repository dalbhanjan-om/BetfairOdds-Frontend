import { createSlice } from "@reduxjs/toolkit";

// Load token from localStorage on initialization
const getInitialToken = () => {
	try {
		return localStorage.getItem("betfairSessionToken") || null;
	} catch (error) {
		return null;
	}
};

const initialState = {
	token: getInitialToken(),
	isAuthenticated: !!getInitialToken(),
	user: null,
	isLoading: false,
	error: null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		loginStart: (state) => {
			state.isLoading = true;
			state.error = null;
		},
		loginSuccess: (state, action) => {
			state.isLoading = false;
			state.token = action.payload.token;
			state.isAuthenticated = true;
			state.user = action.payload.user || null;
			state.error = null;
			// Persist token to localStorage
			try {
				localStorage.setItem("betfairSessionToken", action.payload.token);
			} catch (error) {
				console.error("Failed to save token to localStorage:", error);
			}
		},
		loginFailure: (state, action) => {
			state.isLoading = false;
			state.error = action.payload;
			state.token = null;
			state.isAuthenticated = false;
			state.user = null;
		},
		logout: (state) => {
			state.token = null;
			state.isAuthenticated = false;
			state.user = null;
			state.error = null;
			// Remove token from localStorage
			try {
				localStorage.removeItem("betfairSessionToken");
			} catch (error) {
				console.error("Failed to remove token from localStorage:", error);
			}
		},
		clearError: (state) => {
			state.error = null;
		},
		setToken: (state, action) => {
			state.token = action.payload;
			state.isAuthenticated = !!action.payload;
			// Sync with localStorage
			try {
				if (action.payload) {
					localStorage.setItem("betfairSessionToken", action.payload);
				} else {
					localStorage.removeItem("betfairSessionToken");
				}
			} catch (error) {
				console.error("Failed to sync token with localStorage:", error);
			}
		},
	},
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError, setToken } =
	authSlice.actions;

// Selectors
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;

