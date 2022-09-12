import Vue from 'vue'
import VueRouter from 'vue-router'

import Agencies from '../views/Agencies.vue'
import Agency from '../views/Agency.vue'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import NewTemplate from '../views/NewTemplate.vue'
import NewUpload from '../views/NewUpload.vue'
import Upload from '../views/Upload.vue'
import Uploads from '../views/Uploads.vue'
import ReportingPeriod from '../views/ReportingPeriod.vue'
import ReportingPeriods from '../views/ReportingPeriods.vue'
import Subrecipient from '../views/Subrecipient.vue'
import Subrecipients from '../views/Subrecipients.vue'
import User from '../views/User.vue'
import Users from '../views/Users.vue'
import Validation from '../views/Validation.vue'

import store from '../store/index'

Vue.use(VueRouter)

const routes = [
  { path: '/login', name: 'Login', component: Login },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresLogin: true }
  },
  {
    path: '/new_upload',
    name: 'NewUpload',
    component: NewUpload,
    meta: { requiresLogin: true }
  },
  {
    path: '/new_template/:id',
    name: 'NewTemplate',
    component: NewTemplate,
    meta: { requiresLogin: true }
  },
  {
    path: '/uploads',
    name: 'Uploads',
    component: Uploads,
    meta: { requiresLogin: true }
  },
  {
    path: '/uploads/:id',
    name: 'Upload',
    component: Upload,
    meta: { requiresLogin: true }
  },
  {
    path: '/agencies',
    name: 'Agencies',
    component: Agencies,
    meta: { requiresLogin: true }
  },
  {
    path: '/agencies/:id',
    name: 'Agency',
    component: Agency,
    meta: { requiresLogin: true }
  },
  {
    path: '/reporting_periods',
    name: 'ReportingPeriods',
    component: ReportingPeriods,
    meta: { requiresLogin: true }
  },
  {
    path: '/reporting_periods/:id',
    name: 'ReportingPeriod',
    component: ReportingPeriod,
    meta: { requiresLogin: true }
  },
  {
    path: '/subrecipients',
    name: 'Subrecipients',
    component: Subrecipients,
    meta: { requiresLogin: true }
  },
  {
    path: '/subrecipients/:id',
    name: 'Subrecipient',
    component: Subrecipient,
    meta: { requiresLogin: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
    meta: { requiresLogin: true }
  },
  {
    path: '/users/:id',
    name: 'User',
    component: User,
    meta: { requiresLogin: true }
  },
  {
    path: '/validation',
    name: 'Validation',
    component: Validation,
    meta: { requiresLogin: true }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.VUE_APP_IS_GOST
    ? `${process.env.BASE_URL}arpa_reporter/`
    : process.env.BASE_URL,
  routes
})

function loggedIn () {
  return store.state.user != null
}

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresLogin)) {
    if (!loggedIn()) {
      // This will include any router base URL, if configured
      const redirectTo = router.resolve(to.fullPath).href

      next({
        path: '/login',
        query: { redirect_to: redirectTo }
      })
    } else {
      next()
    }
  } else {
    next() // make sure to always call next()!
  }
})

export default router

// NOTE: This file was copied from src/router/index.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
