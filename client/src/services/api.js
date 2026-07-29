const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new ApiError("API URL is not configured. Set VITE_API_URL before calling backend services.", 0);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch (_) {
      // Keep the default message if the backend returns a non-JSON error.
    }
    throw new ApiError(message, response.status);
  }

  return response.json();
}
