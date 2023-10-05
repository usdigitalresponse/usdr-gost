<template>
  <section style="max-width: 516px;" class="mx-auto my-5 px-2">
    <h2>My Profile</h2>
    <b-row style="margin-top: 4rem;">
      <b-col>
        <b-avatar :text="initials" size="5rem"></b-avatar>
      </b-col>
      <b-col cols="7">
        <p class="mb-2 h6"><b>{{ name }}</b></p>
        <p class="mb-2">{{ email }}</p>
        <p class="mb-2">{{ agency }}</p>
      </b-col>
      <b-col class="text-end">
        <b-button variant="primary" size="md">
          <b-icon icon="pencil-fill" scale="0.8"></b-icon>
          <span class="ml-1">Edit</span>
        </b-button>
      </b-col>
    </b-row>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
    }),
    name() {
      return this.loggedInUser.name;
    },
    email() {
      return this.loggedInUser.email;
    },
    agency() {
      return this.loggedInUser.agency_name;
    },
    initials() {
      const fullNameArr = this.name.split(' ');
      const firstName = fullNameArr.at(0);
      const lastName = fullNameArr.at(-1);
      return (firstName[0] + lastName[0]).toUpperCase();
    },
  },
};
</script>
