import urlJoin from 'url-join';
import _ from 'lodash';

export function apiURL(endpointPath) {
  const baseURL = (window.APP_CONFIG || {}).apiURLForGOST || '/';
  return urlJoin(baseURL, endpointPath);
}

function getDefaultHeaders() {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  return headers;
}

/*
* Turns param object {limit: 1, paginateFrom: 2} into uri string '?limit=1&paginateFrom=2
* Removes emtpy values
*/
export const serializeQuery = (params = {}) => {
  const cleaned = _.omitBy(params, (val) => val === null || val === undefined);
  const searchParams = new URLSearchParams(cleaned);
  return searchParams.size ? `?${searchParams.toString()}` : '';
};

export function get(url) {
  const options = {
    credentials: 'include',
    headers: getDefaultHeaders(),
  };
  return fetch(apiURL(url), options).then((r) => {
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
  return fetch(apiURL(url), options)
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
  return fetch(apiURL(url), options)
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
  return fetch(apiURL(url), options)
    .then((r) => {
      if (r.ok) {
        return r.json();
      }
      return r
        .text()
        .then((text) => Promise.reject(new Error(text || r.statusText)));
    });
}

export function patch(url, body) {
  const options = {
    method: 'PATCH',
    credentials: 'include',
    headers: getDefaultHeaders(),
    body: JSON.stringify(body),
  };
  return fetch(apiURL(url), options)
    .then((r) => {
      if (r.ok) {
        return r.json();
      }
      return r
        .text()
        .then((text) => Promise.reject(new Error(text || r.statusText)));
    });
}
