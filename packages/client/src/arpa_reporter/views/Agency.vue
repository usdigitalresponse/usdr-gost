<template>
  <div>
    <h2>Agency</h2>

    <div v-if="agency === null" class="spinner-grow text-primary" role="status">
      <span class="sr-only">Loading...</span>
    </div>

    <div v-else>
      <StandardForm :initialRecord="agency" :cols="cols" @save="onSave" @reset="onReset" :key="formKey" />
    </div>
  </div>
</template>

<script>
import StandardForm from '../components/StandardForm'

import { post } from '../store/index'

export default {
  name: 'Agency',
  data: function () {
    return {
      formKey: Date.now()
    }
  },
  computed: {
    agencyId: function () {
      return this.$route.params.id
    },
    isNew: function () {
      return this.agencyId === 'new'
    },
    agency: function () {
      if (this.isNew) return {}
      const fromStore = this.$store.state.agencies.find(a => a.id === Number(this.agencyId))
      return fromStore || null
    },
    cols: function () {
      return [
        { label: 'ID', field: 'id', readonly: true },
        { label: 'Agency Code', field: 'code', required: true },
        { label: 'Agency Name', field: 'name', required: true }
      ]
    }
  },
  methods: {
    onSave: async function (updatedAgency) {
      try {
        const result = await post('/api/agencies', { agency: updatedAgency })
        if (result.error) throw new Error(result.error)

        const text = this.isNew
          ? `Agency ${updatedAgency.code} successfully created`
          : `Agency ${this.agencyId} successfully updated`

        this.$store.commit('addAlert', {
          text,
          level: 'ok'
        })

        this.$store.dispatch('updateAgencies')
        if (this.isNew) {
          return this.$router.push(`/agencies/${result.agency.id}`)
        }
      } catch (e) {
        this.$store.commit('addAlert', {
          text: `Error saving agency: ${e.message}`,
          level: 'err'
        })
      }
    },
    onReset () {
      this.formKey = Date.now()
    }
  },
  watch: {
    agencyId: function () {
      this.onReset()
    }
  },
  mounted: async function () {
    this.$store.dispatch('updateAgencies')
  },
  components: {
    StandardForm
  }
}
</script>

<!-- NOTE: This file was copied from src/views/Agency.vue (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z -->
