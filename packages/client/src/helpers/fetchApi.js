import store from '@/store';

function getDefaultHeaders() {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  return headers;
}

export function addOrganizationId(url) {
  return `${process.env.VUE_APP_GRANTS_API_URL}${url.replace(':organizationId', store.getters['users/selectedAgencyId'])}`;
}

export function get(url) {
  const options = {
    credentials: 'include',
    headers: getDefaultHeaders(),
  };
  return fetch(addOrganizationId(url), options).then((r) => {
    if (r.ok) {
      return r.json();
    }
    return r
      .text()
      .then((text) => Promise.reject(new Error(text || r.statusText)));
  });
}

export function deleteRequest(url, body) {
  const options = {
    method: 'DELETE',
    credentials: 'include',
    headers: getDefaultHeaders(),
    body: JSON.stringify(body),
  };
  return fetch(addOrganizationId(url), options)
    .then((r) => {
      if (r.ok) {
        return r.json();
      }
      return r
        .text()
        .then((text) => Promise.reject(new Error(text || r.statusText)));
    });
}

export function post(url, body) {
  const options = {
    method: 'POST',
    credentials: 'include',
    headers: getDefaultHeaders(),
    body: JSON.stringify(body),
  };
  return fetch(addOrganizationId(url), options)
    .then((r) => {
      if (r.ok) {
        return r.json();
      }
      return r
        .text()
        .then((text) => Promise.reject(new Error(text || r.statusText)));
    });
}

export function put(url, body) {
  const options = {
    method: 'PUT',
    credentials: 'include',
    headers: getDefaultHeaders(),
    body: JSON.stringify(body),
  };
  return fetch(addOrganizationId(url), options)
    .then((r) => {
      if (r.ok) {
        return r.json();
      }
      return r
        .text()
        .then((text) => Promise.reject(new Error(text || r.statusText)));
    });
}
