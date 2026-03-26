function getToken() {
  try {
    const stored = localStorage.getItem('qod_user')
    return stored ? JSON.parse(stored).token : null
  } catch {
    return null
  }
}

async function request(method, path, body) {
  const token = getToken()
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    // Session expired — clear local auth and redirect to login
    localStorage.removeItem('qod_user')
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
    return
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: (path) => request('GET', path),
  put: (path, body) => request('PUT', path, body),
  post: (path, body) => request('POST', path, body),
  del: (path) => request('DELETE', path),
}
