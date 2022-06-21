<template>
  <b-card
    no-body
    tag="div"
    style="max-width: 32rem; border: none; margin-top: 12rem"
    class="mx-auto"
  >
    <b-card-img
      :src="require('../assets/usdr_logo_standard_wide.svg')"
      style="max-width: 20rem;"
      alt="United States Digital Response logo in standard colors"
      top
    ></b-card-img>

    <b-card-text class="pt-5">
      <h1>Grants Identification Tool</h1>
      <form @submit="login" class="mt-3">
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
        <div
          class="form-group d-flex justify-content-center"
        >
          <b-button
            variant="primary"
            class="btn-block"
            type="Submit"
            @click="login"
          >
            Login
          </b-button>
        </div>
      </form>
      <div :class="messageClass" class="mt-3" v-if="message">{{ message }}</div>
    </b-card-text>
  </b-card>
</template>

<script>
/* eslint-disable import/no-unresolved */
import _ from 'lodash-checkit';

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
      const body = JSON.stringify({
        email: this.email,
      });
      const headers = {
        'Content-Type': 'application/json',
      };
      let resStatus = 0;
      fetch(`${process.env.VUE_APP_GRANTS_API_URL}/api/sessions`, {
        method: 'POST',
        headers,
        body,
      })
        .then((r) => {
          resStatus = r.status;
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
        .catch((err) => {
          this.message = resStatus === 500
            ? 'There was a problem at USDR. Try again in a minute or two, and if you still receive the same error, contact the USDR team.'
            : err.message;
          this.messageClass = 'alert alert-danger';
        });
    },
  },
};
</script>

<style scoped>
.login {
  width: 90%;
  margin: 44px auto;
}
h4 {
  margin: 100px 0 20px 0;
}
</style>
