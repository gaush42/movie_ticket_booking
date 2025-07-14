const API = (() => {
  const BASE = 'http://localhost:3000/api/manager';
  let token = null;

  const setToken = (t) => (token = t);

  const headers = () => ({
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  });

  const get = async (path) =>
    fetch(BASE + path, { headers: headers() }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    });

  const post = (path, data) =>
    fetch(BASE + path, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    });

  const put = (path, data) =>
    fetch(BASE + path, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    });

  const del = (path) =>
    fetch(BASE + path, {
      method: 'DELETE',
      headers: headers(),
    }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    });

  return { setToken, get, post, put, del };
})();