<template>
  <main style="max-width: 516px;" class="mx-auto my-5 px-2">
    <h2>My Profile</h2>
    <section style="margin-top: 4rem;">
      <b-row>
        <b-col>
          <b-avatar :text="initials" size="5rem"></b-avatar>
        </b-col>
        <b-col cols="7">
          <p class="mb-2 h6"><b>{{ name }}</b></p>
          <p class="mb-2">{{ email }}</p>
          <p class="mb-2">{{ agency }}</p>
        </b-col>
        <b-col class="text-end">
          <b-button variant="primary" size="md" @click="$bvModal.show('edit-user-modal')">
            <b-icon icon="pencil-fill" scale="0.8"></b-icon>
            <span class="ml-1">Edit</span>
          </b-button>
        </b-col>
      </b-row>
    </section>
    <section style="margin-top: 3.5rem;">
      <h3>Email Notifications</h3>
      <b-row style="margin-top: 1.5rem;">
        <b-col cols="11">
          <p class="mb-0">New Grant Digest</p>
          <p class="pref-description">Send me a daily email if new grants match my saved search(es).</p>
        </b-col>
        <b-col cols="1">
          <b-form-checkbox switch></b-form-checkbox>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="11">
          <p class="mb-0">Grants Assignment</p>
          <p class="pref-description">Send me notifications if a grant has been assigned to my USDR Grants team.</p>
        </b-col>
        <b-col cols="1">
          <b-form-checkbox switch></b-form-checkbox>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="11">
          <p class="mb-0">Occasional Updates</p>
          <p class="pref-description">Send me occasional emails about feature releases, surveys, and other updates.</p>
        </b-col>
        <b-col cols="1">
          <b-form-checkbox switch></b-form-checkbox>
        </b-col>
      </b-row>
    </section>
    <EditUserModal/>
  </main>
</template>

<script>
import { mapGetters } from 'vuex';
import EditUserModal from '@/components/Modals/EditUser.vue';

export default {
  components: {
    EditUserModal,
  },
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
<style>
  .pref-description {
    font-size: 12px;
    margin-bottom: 1.25rem;
  }
</style>
