<!-- Adding this at the top because the rule was still getting flagged when added next-line -->
<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div class="my-3">
    <h1>ARPA Reporter Login</h1>
    <div
      v-if="transitionMessageEnabled"
      :class="{
        'alert alert-info': transitionMessageEnabled,
      }"
    >
      <h2 class="h2">
        The ARPA Reporter is now managed by Nava PBC.  Please access the tool at:
        <a href="https://grants.navapbc.com/arpa_reporter">grants.navapbc.com/arpa_reporter</a>
      </h2>
    </div>
    <form @submit="login">
      <div class="form-group">
        <input
          id="email"
          v-model="email"
          class="form-control"
          name="email"
          placeholder="Email address"
          autofocus
          :disabled="!loginEnabled"
        >
      </div>
      <div class="form-group">
        <button
          class="btn usdr-btn-primary"
          type="Submit"
          :disabled="!loginEnabled"
          @click="login"
        >
          Send email with login link
        </button>
      </div>
    </form>
    <div
      v-if="serverResponse"
      :class="{
        'alert alert-success': serverResponse.success,
        'alert alert-danger': !serverResponse.success,
      }"
    >
      {{ serverResponse.message }}
    </div>
    <div
      v-for="error of v$.$errors"
      :key="error.$uid"
      class="alert alert-danger"
    >
      {{ error.$message }}
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core';
import { required, email, helpers } from '@vuelidate/validators';
import { apiURL } from '@/helpers/fetchApi';
import { arpaLoginEnabled, arpaTransitionMessageEnabled } from '@/helpers/featureFlags';

export default {
  name: 'LoginView',
  setup() {
    return { v$: useVuelidate() };
  },
  data() {
    const serverResponse = this.$route.query.message && {
      message: this.$route.query.message,
      success: false, // If message is present in the URL, it's because of an error (e.g., invalid token)
    };
    return {
      email: '',
      serverResponse,
    };
  },
  computed: {
    transitionMessageEnabled() {
      return arpaTransitionMessageEnabled();
    },
    loginEnabled() {
      return arpaLoginEnabled();
    },
  },
  validations: {
    email: {
      required: helpers.withMessage('Please enter an email address', required),
      email: helpers.withMessage('Please enter a valid email address', email),
    },
  },
  methods: {
    async login(event) {
      event.preventDefault();
      this.serverResponse = null;
      if (!(await this.v$.$validate())) {
        return;
      }
      this.v$.$reset();

      const body = JSON.stringify({
        email: this.email,
        redirect_to: this.$route.query.redirect_to || this.$router.resolve('/').href,
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
          this.serverResponse = {
            message: r.message,
            success: r.success,
          };
        })
        .catch((error) => {
          console.log('error:', error.message);
          this.serverResponse = {
            message: error.message
              || 'There was a problem at USDR. Try again in a minute or two, and if you still receive the same error, contact the USDR team.',
            success: false,
          };
        });
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Login.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
