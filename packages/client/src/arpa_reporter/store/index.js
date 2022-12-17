/* eslint camelcase: 0 */

import Vue from 'vue'
import Vuex from 'vuex'
import moment from 'moment'
import _ from 'lodash'
import { apiURL } from '@/helpers/fetchApi'

Vue.use(Vuex)

export function get (url) {
  const options = {
    credentials: 'include'
  }
  return fetch(apiURL(url), options)
}

// this function always returns an object. in case of success, the object is
// the JSON sent by the server. in case of any errors, the `error` property
// contains a description of the error.
export async function getJson (url) {
  // did we get an error even making the request?
  let resp
  const options = {
    credentials: 'include',
  }
  try {
    resp = await fetch(apiURL(url), options)
  } catch (e) {
    return { error: e, status: null }
  }

  const text = await resp.text()

  // the response *should* be JSON -- is it?
  let json
  try {
    json = JSON.parse(text)
  } catch (e) {
    json = null
  }

  if (resp.ok) {
    return json || { error: 'Server sent invalid JSON response', text }
  } else if (json?.error) {
    return json
  } else {
    return { error: `Server error ${resp.status} (${resp.statusText}): ${text}`, status: resp.status }
  }
}

export async function post (url, body) {
  const options = {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  const resp = await fetch(apiURL(url), options)
  if (resp.ok) return resp.json()

  const text = await resp.text()
  let errorMsg
  try {
    const json = JSON.parse(text)
    errorMsg = json.error ?? text
  } catch (e) {
    errorMsg = text || resp.statusText
  }

  throw new Error(errorMsg)
}

export function postForm (url, formData) {
  const options = {
    method: 'POST',
    credentials: 'include',
    body: formData
  }
  return fetch(apiURL(url), options)
}

export function put (url, body) {
  const options = {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  return fetch(apiURL(url), options).then(r => {
    if (r.ok) {
      return r.json()
    }
    return r
      .text()
      .then(text => Promise.reject(new Error(text || r.statusText)))
  })
}

function randomId () {
  return Math.random().toString(16).substr(2, 10)
}

export default new Vuex.Store({
  state: {
    user: null,
    applicationSettings: {},
    roles: [],
    users: [],
    agencies: [],
    reportingPeriods: [],
    viewPeriodID: null,

    recentUploadId: null,
    allUploads: [],
    alerts: {}
  },
  mutations: {
    setRecentUploadId (state, uploadId) {
      state.recentUploadId = uploadId
    },
    setUser (state, user) {
      state.user = user
    },
    setAgencies (state, agencies) {
      state.agencies = agencies
    },
    setRoles (state, roles) {
      state.roles = roles
    },
    setUsers (state, users) {
      state.users = users
      if (state.user) {
        const updatedUser = users.find(u => u.id === state.user.id)
        state.user = updatedUser
      }
    },
    setReportingPeriods (state, reportingPeriods) {
      state.reportingPeriods = reportingPeriods
    },
    setApplicationSettings (state, applicationSettings) {
      state.applicationSettings = applicationSettings
      // note: cannot commit setViewPeriodID from another mutation
      if (!state.viewPeriodID) {
        state.viewPeriodID = applicationSettings.current_reporting_period_id
      }
    },
    setViewPeriodID (state, period_id) {
      state.viewPeriodID = period_id
    },
    setAllUploads (state, updatedUploads) {
      state.allUploads = updatedUploads
    },
    addAlert (state, alert) {
      Vue.set(state.alerts, randomId(), alert)
    },
    dismissAlert (state, alertId) {
      Vue.delete(state.alerts, alertId)
    }
  },
  actions: {
    login: async function ({ commit, dispatch }, user) {
      commit('setUser', user)

      // to ensure consistent application state, lets block rendering until these complete
      await Promise.all([
        dispatch('updateApplicationSettings'),
        dispatch('updateReportingPeriods'),
        dispatch('updateAgencies'),
        dispatch('updateUsersRoles')
      ])
    },
    logout ({ commit }) {
      fetch(apiURL('/api/sessions/logout')).then(() => commit('setUser', null))
    },
    setViewPeriodID ({ commit }, period_id) {
      commit('setViewPeriodID', period_id)
    },

    async updateUploads ({ commit, state }) {
      const params = new URLSearchParams({ period_id: state.viewPeriodID })
      const result = await getJson('/api/uploads?' + params.toString())

      if (result.error) {
        commit('addAlert', { text: `updateUploads Error: ${result.error} (${result.text})`, level: 'err' })
      } else {
        commit('setAllUploads', result.uploads)
      }
    },
    async updateAgencies ({ commit, state }) {
      const result = await getJson('/api/agencies')
      if (result.error) {
        commit('addAlert', { text: `updateAgencies Error: ${result.error} (${result.text})`, level: 'err' })
      } else {
        commit('setAgencies', result.agencies)
      }
    },
    async updateReportingPeriods ({ commit, state }) {
      const result = await getJson('/api/reporting_periods')
      if (result.error) {
        commit(
          'addAlert',
          { text: `updateReportingPeriods Error: ${result.error} (${result.text})`, level: 'err' }
        )
      } else {
        commit('setReportingPeriods', result.reportingPeriods)
      }
    },
    async updateUsersRoles ({ commit, state }) {
      const result = await getJson('/api/users')
      if (result.error) {
        commit('addAlert', { text: `updateUsersRoles Error: ${result.error} (${result.text})`, level: 'err' })
      } else {
        commit('setRoles', result.roles)
        commit('setUsers', result.users)
      }
    },
    async updateApplicationSettings ({ commit }) {
      const result = await getJson('/api/application_settings')
      if (result.error) {
        const text = `updateApplicationSettings Error: ${result.error} (${result.text})`
        commit('addAlert', { text, level: 'err' })
      } else {
        commit('setApplicationSettings', result.application_settings)
      }
    }
  },
  modules: {},
  getters: {
    periodNames: state => {
      return _.map(state.reportingPeriods, 'name')
    },
    user: state => {
      return state.user || {}
    },
    agencyName: state => id => {
      const agency = _.find(state.agencies, { id })
      return agency ? agency.name : ''
    },
    applicationTitle: state => {
      const title = _.get(state, 'applicationSettings.title', '')
      // NOTE(mbroussard): this fallback is important for logged out navbar since we don't have
      // application_settings yet on the login page
      return title || 'ARPA Reporter'
    },
    currentPeriodID: state => {
      return Number(state.applicationSettings.current_reporting_period_id)
    },
    viewPeriodID: state => {
      return Number(state.viewPeriodID)
    },
    viewPeriodIsCurrent: (state, getters) => {
      return getters.viewPeriodID === getters.currentPeriodID
    },
    currentReportingPeriod: (state, getters) => {
      return state.reportingPeriods.find(period => period.id === getters.currentPeriodID)
    },
    viewPeriod: (state, getters) => {
      return state.reportingPeriods.find(period => period.id === getters.viewPeriodID)
    },
    viewableReportingPeriods: state => {
      const now = moment()
      const viewable = state.reportingPeriods
        .filter(period => moment(period.start_date) <= now)
        .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
      return viewable
    },
    roles: state => {
      return state.roles
    }
  }
})

// NOTE: This file was copied from src/store/index.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
