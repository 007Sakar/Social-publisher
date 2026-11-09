
export const API_URL = "http://127.0.0.1:8000/api/";

// Reusable authenticated API request
export async function apiFetch(endpoint, options = {}) {
  const token = sessionStorage.getItem("socialflow_token");

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}
