const API_BASE = 'http://localhost:3000/api'

const get = async (url, token) => {
  const res = await fetch(API_BASE + url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  return res.json()
}

const post = async (url, body, token) => {
  const res = await fetch(API_BASE + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(body)
  })
  return res.json()
}

const del = async (url, token) => {
  const res = await fetch(API_BASE + url, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  return res.json()
}

window.api = { get, post, del }
