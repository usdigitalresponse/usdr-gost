<template>
  <div class="login">
    <h1>Grants Identification Tool</h1>
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
          Login
        </button>
      </div>
    </form>
    <div :class="messageClass" v-if="message">{{ message }}</div>
  </div>
</template>

<script>
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
      fetch(`${process.env.VUE_APP_GRANTS_API_URL}/api/sessions`, { method: 'POST', headers, body })
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
        .catch((err) => {
          console.log('error:', err.message);
          this.message = err.message;
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
