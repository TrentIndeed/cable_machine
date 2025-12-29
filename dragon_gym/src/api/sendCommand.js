function getApiBase() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001';
  }
  return process.env.REACT_APP_API_BASE || `http://${window.location.hostname}:3001`;
}

export async function sendCommand(command) {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/cmd`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.error ||
      (Array.isArray(errorBody?.errors) ? errorBody.errors.join(' ') : '') ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
