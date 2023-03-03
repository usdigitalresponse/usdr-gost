<template>
  <div class="my-3">
    <h2>ARPA Reporter Login</h2>
    <form @submit="login">
      <div class="form-group">
        <input
          class="form-control"
          id="email"
          name="email"
          placeholder="Email address"
          v-model="email"
          autofocus
        />
      </div>
      <div class="form-group">
        <button class="btn btn-primary" type="Submit" @click="login">
          Send email with login link
        </button>
      </div>
    </form>
    <div :class="messageClass" v-if="message">{{ message }}</div>
  </div>
</template>

<script>
import _ from 'lodash-checkit';
import { apiURL } from '@/helpers/fetchApi';

export default {
  name: 'Login',
  data() {
    const message = _.get(this, '$route.query.message', null);
    const messageClass = message ? 'alert alert-danger' : '';
    return {
      email: '',
      message,
      messageClass,
    };
  },
  methods: {
    login(e) {
      e.preventDefault();
      if (!this.email) {
        this.message = 'Email cannot be blank';
        this.messageClass = 'alert alert-danger';
        return;
      }
      if (!_.isEmail(this.email)) {
        this.message = `'${this.email}' is not a valid email address`;
        this.messageClass = 'alert alert-danger';
        return;
      }

      const redirectTo =
        // If we got to the login page via a redirect, a post-login redirect URL will already be specified
        this.$route.query.redirect_to
        // If we went to the login page directly, we default to redirecting to the homepage.
        // This gets a full relative URL including any VueRouter base prefix, if configured (such as in GOST)
        || this.$router.resolve('/').href;

      const body = JSON.stringify({
        email: this.email,
        redirect_to: redirectTo,
      });
      const headers = {
        'Content-Type': 'application/json',
      };
      fetch(apiURL('/api/sessions'), { method: 'POST', headers, body })
        .then((r) => {
          if (!r.ok) throw new Error(`login: ${r.statusText} (${r.status})`);
          return r;
        })
        .then((r) => r.json())
        .then((r) => {
          this.email = '';
          this.message = r.message;
          this.messageClass = r.success
            ? 'alert alert-success'
            : 'alert alert-danger';
        })
        .catch((e) => {
          console.log('error:', e.message);
          this.message = e.message;
          this.messageClass = 'alert alert-danger';
        });
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Login.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
