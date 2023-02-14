<template>
  <div>
    <h2>Agency</h2>

    <div v-if="agency === null" class="spinner-grow text-primary" role="status">
      <span class="sr-only">Loading...</span>
    </div>

    <div v-else>
      <StandardForm 
        :fields="fields"
        @submit="onSubmit"
        @reset="onReset"
        :key="formKey" 
      />
    </div>
  </div>
</template>

<script>
import StandardForm from '../components/StandardForm'
import { required } from 'vuelidate/lib/validators';

import { post } from '../store/index'

export default {
  name: 'Agency',
  data: function () {
    return {
      formKey: Date.now(),
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
    fields: function () {
      return [
        {   
          type: 'text',
          label: 'ID',
          name: 'id',
          readonly: true, 
          initialValue: this.agency ? this.agency.id : '',
          validationRules: [],
        },
        { 
          type: 'text',
          label: 'Agency Code',
          name: 'code',
          validationRules: {required},
          initialValue: this.agency ? this.agency.code : '',
        },
        { 
          type: 'text',
          label: 'Agency Name',
          name: 'name',
          validationRules: {required},
          initialValue: this.agency ? this.agency.name : '',
        }
      ]
    }
  },
  methods: {
    onSubmit: async function (updatedAgency) {
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

<!-- NOTE: This file was copied from src/views/Agency.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
