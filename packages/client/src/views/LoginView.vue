<!-- Adding this at the top because the rule was still getting flagged when added next-line -->
<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <main>
    <b-card
      no-body
      tag="div"
      style="max-width: 26rem; margin-top: 11rem"
      class="mx-auto border-0"
    >
      <b-card-img
        :src="logo"
        style="max-width: 14rem"
        alt="United States Digital Response logo"
        class="mx-auto mb-3"
        top
      />
      <b-card-text class="mt-4 p-3 dropshadow-card">
        <h1 class="h3 my-4">
          Log in to Federal Grant Finder
        </h1>
        <p class="mb-4">
          Enter your email to receive a one-time login link.
        </p>
        <form @submit="login">
          <div>
            <!-- eslint-disable-next-line vuejs-accessibility/label-has-for  -->
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              class="form-control mb-4"
              name="email"
              placeholder="Email address"
              autofocus
            >
          </div>
          <div
            class="d-flex justify-content-center"
          >
            <b-button
              variant="primary"
              class="btn-block"
              type="Submit"
              @click="login"
            >
              Send me the link
            </b-button>
          </div>
        </form>
        <div
          v-if="serverResponse"
          class="mt-3"
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
          class="mt-3 alert alert-danger"
        >
          {{ error.$message }}
        </div>
      </b-card-text>
      <div>
        <div class="font-weight-bold">
          Don't have an account?
        </div>
        <div>
          <span>If you are within the state of New Jersey </span>
          <a
            href="https://forms.office.com/pages/responsepage.aspx?id=0cN2UAI4n0uzauCkG9ZCp7ITdp07WUhBmfHGHVfxwctUNVFJNFNPUllWSTBQNFZCQlMyMjlWWU5NUiQlQCN0PWcu&route=shorturl"
            target="_blank"
            aria-label="link to New Jersey registration form"
          >register here.</a>
        </div>
        <div>
          <span>If you are within the state of Nevada </span>
          <a
            href="https://forms.office.com/pages/responsepage.aspx?id=5kCj5J64aE6OqhVE0nA5gBT1YIeXbrtMjy6yqM5ILm1UQVQwT0xOT1QxU0dNU1BDN05WWDdaVFRBRS4u&route=shorturl"
            target="_blank"
            aria-label="link to Nevada registration form"
          >register here.</a>
        </div>
        <div>
          <span>If you are located elsewhere </span>
          <a
            href="https://form.jotform.com/240083950102041"
            target="_blank"
          >connect with USDR here.</a>
        </div>
        <div class="mt-3">
          <span class="font-weight-bold">Need help? </span><a href="mailto:grants-helpdesk@usdigitalresponse.org?subject=Federal Grant Finder Login Issue">Contact USDR for support.</a>
        </div>
      </div>
    </b-card>
  </main>
</template>

<script>
/* eslint-disable import/no-unresolved */
import { useVuelidate } from '@vuelidate/core';
import { required, email, helpers } from '@vuelidate/validators';
import { apiURL } from '@/helpers/fetchApi';
import logo from '@/assets/usdr_logo_standard_wide.svg';

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
      logo,
    };
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
