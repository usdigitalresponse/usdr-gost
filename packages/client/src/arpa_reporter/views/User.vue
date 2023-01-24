<template>
  <div>
    <h2>User</h2>

    <div v-if="user === null" class="spinner-grow text-primary" role="status">
      <span class="sr-only">Loading...</span>
    </div>

    <div v-else>
      <div class="form-group row" v-if="!isNew">
        <div class="col-sm-2">
          Created:
        </div>
        <div class="col-sm-10">
          {{ user.created_at }}
        </div>
      </div>

      <StandardForm :initialRecord="user" :cols="cols" @save="onSave" @reset="onReset" :key="formKey" />
    </div>
  </div>
</template>

<script>
import StandardForm from '../components/StandardForm';
import { post } from '../store/index';

export default {
  name: 'User',
  data() {
    return {
      user: null,
      formKey: Date.now(),
    };
  },
  computed: {
    userId() {
      return this.$route.params.id;
    },
    isNew() {
      return this.userId === 'new';
    },
    cols() {
      return [
        { label: 'ID', field: 'id', readonly: true },
        { label: 'Email', field: 'email', required: true },
        { label: 'Name', field: 'name', required: true },
        {
          label: 'Role', field: 'role', selectItems: this.roleItems, required: true,
        },
        { label: 'Agency', field: 'agency_id', selectItems: this.agencyItems },
      ];
    },
    roles() {
      return this.$store.getters.roles || [];
    },
    roleItems() {
      return this.roles.map((r) => ({ label: r.name, value: r.name }));
    },
    agencyItems() {
      return [{ value: null, name: '' }].concat(
        this.$store.state.agencies.map((a) => ({ label: a.name, value: a.id })),
      );
    },
  },
  methods: {
    async loadUser() {
      if (this.isNew) {
        this.user = {};
        return;
      }

      this.user = null;
      await this.$store.dispatch('updateUsersRoles');

      const storeUser = this.$store.state.users.find((u) => u.id === Number(this.userId));
      // StandardForm deals in ARPA Reporter's former user object representation where "role" is a simple string field, but the API and store now deal in the GOST format where role is an object.
      this.user = { ...storeUser, role: storeUser.role.name };
    },
    async onSave(user) {
      this.user = null;

      try {
        // StandardForm deals in ARPA Reporter's former user object representation where "role" is a simple string field, but the API now deals in the GOST format where role is an object.
        const gostUser = { ...user, role: this.roles.find((r) => r.name === user.role) };

        const result = await post('/api/users', { user: gostUser });
        if (result.error) throw new Error(result.error);

        const text = this.isNew
          ? `User ${result.user.id} successfully created`
          : `User ${result.user.email} successfully updated`;

        this.$store.commit('addAlert', {
          text,
          level: 'ok',
        });

        if (this.isNew) {
          return this.$router.push(`/users/${result.user.id}`);
        }
        this.loadUser();
      } catch (err) {
        this.user = user;
        this.$store.commit('addAlert', {
          text: `Error updating user ${user.email}: ${err.message}`,
          level: 'err',
        });
      }
    },
    onReset() {
      this.formKey = Date.now();
    },
  },
  watch: {
    userId() {
      this.loadUser();
    },
  },
  async mounted() {
    this.loadUser();
  },
  components: {
    StandardForm,
  },
};
</script>

<!-- NOTE: This file was copied from src/views/User.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
