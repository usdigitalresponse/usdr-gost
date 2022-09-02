<template>
  <div>
    <h2>Agencies</h2>

    <div class="mb-4">
      <router-link to="/agencies/new" class="btn btn-primary">
        Create New Agency
      </router-link>
    </div>

    <div>
      <table v-if="agencies" class="table table-striped">
        <thead>
          <tr>
            <th>Agency Code</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="agency in agencies" :key="agency.code">
            <td>{{ agency.code }}</td>
            <td>{{ agency.name }}</td>
            <td>
              <router-link :to="`/agencies/${agency.id}`" class="btn btn-sm btn-secondary">
                Edit
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Agencies',
  computed: {
    agencies: function () {
      return this.$store.state.agencies
    }
  },
  mounted: async function () {
    this.$store.dispatch('updateAgencies')
  }
}
</script>

<!-- NOTE: This file was copied from src/views/Agencies.vue (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z -->
