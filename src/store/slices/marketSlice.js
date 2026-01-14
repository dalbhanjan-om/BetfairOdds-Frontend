import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  markets: [], // { marketId, marketName, runnerSelectionIds: number[] }
  selectedMarketId: null,
};

const marketSlice = createSlice({
  name: "markets",
  initialState,
  reducers: {
    setMarkets: (state, action) => {
      state.markets = action.payload || [];
    },
    setSelectedMarket: (state, action) => {
      state.selectedMarketId = action.payload || null;
    },
    clearMarkets: (state) => {
      state.markets = [];
      state.selectedMarketId = null;
    },
  },
});

export const { setMarkets, setSelectedMarket, clearMarkets } = marketSlice.actions;

export const selectMarkets = (state) => state.markets.markets;
export const selectSelectedMarketId = (state) => state.markets.selectedMarketId;

export default marketSlice.reducer;

