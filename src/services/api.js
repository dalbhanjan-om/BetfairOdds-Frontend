import axiosInstance from "./axiosInstance";

// Calls Express backend combined login endpoint (Betfair + Roanuz)
export async function login({ username, password }) {
  const response = await axiosInstance.post("/login", {
    username,
    password,
  });
  console.log("Login response data:", response.data);

  return response.data;
}

// Fetches cricket events for today and tomorrow via Express proxy
// token: optional token parameter. If not provided, falls back to localStorage
export async function listEvents(token = null) {
  const authToken = token || localStorage.getItem("betfairSessionToken");
  if (!authToken) {
    throw new Error("Missing session token. Please log in first.");
  }

  const response = await axiosInstance.post(
    "/events",
    {},
    {
      headers: {
        "X-Authentication": authToken,
      },
    }
  );

  return response.data;
}

// Fetches market catalogue for a given eventId
export async function listMarketCatalogue({ token = null, eventId }) {
  const authToken = token || localStorage.getItem("betfairSessionToken");
  if (!authToken) {
    throw new Error("Missing session token. Please log in first.");
  }

  if (!eventId) {
    throw new Error("eventId is required to fetch market catalogue");
  }

  const response = await axiosInstance.post(
    "/market-catalogue",
    { eventId },
    {
      headers: {
        "X-Authentication": authToken,
      },
    }
  );

  return response.data;
}

// Starts a Betfair streaming bot for a specific marketId
export async function startBot({ token = null, marketId, size = 1, upThreshold = 5, downThreshold = 2 }) {
  const authToken = token || localStorage.getItem("betfairSessionToken");
  if (!authToken) {
    throw new Error("Missing session token. Please log in first.");
  }

  if (!marketId) {
    throw new Error("marketId is required to start bot");
  }

  const response = await axiosInstance.post(
    "/bot/start",
    { marketId, size, upThreshold, downThreshold },
    {
      headers: {
        "X-Authentication": authToken,
      },
    }
  );

  return response.data;
}

// Stops a Betfair streaming bot for a specific marketId
export async function stopBot({ token = null, marketId }) {
  const authToken = token || localStorage.getItem("betfairSessionToken");
  if (!authToken) {
    throw new Error("Missing session token. Please log in first.");
  }

  if (!marketId) {
    throw new Error("marketId is required to stop bot");
  }

  const response = await axiosInstance.post(
    "/bot/stop",
    { marketId },
    {
      headers: {
        "X-Authentication": authToken,
      },
    }
  );

  return response.data;
}

// Gets the status of bot(s)
export async function getBotStatus({ token = null, marketId = null }) {
  const authToken = token || localStorage.getItem("betfairSessionToken");
  if (!authToken) {
    throw new Error("Missing session token. Please log in first.");
  }

  const response = await axiosInstance.get("/bot/status", {
    params: marketId ? { marketId } : {},
    headers: {
      "X-Authentication": authToken,
    },
  });

  return response.data;
}
