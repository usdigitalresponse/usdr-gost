<template>
  <div>
    <h2>Reporting Period</h2>

    <div v-if="reportingPeriod === null" class="spinner-grow text-primary" role="status">
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
import StandardForm from '../components/StandardForm';
import { required } from 'vuelidate/lib/validators';
import { post } from '../store/index';

export default {
  name: 'ReportingPeriod',
  data: () => ({ formKey: Date.now() }),
  computed: {
    reportingPeriodId: function () {
      return this.$route.params.id
    },
    isNew: function () {
      return this.reportingPeriodId === 'new'
    },
    reportingPeriod: function () {
      if (this.isNew) return {}
      const fromStore = this.$store.state.reportingPeriods
        .find(p => p.id === Number(this.reportingPeriodId))
      return fromStore || null
    },
    fields: function () {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      return [
        { 
          type: 'text',
          label: 'ID',
          name: 'id',
          validationRules: [],
          initialValue: this.reportingPeriod.id,
          readonly: true
        },
        { 
          type: 'text',
          label: 'Period Name',
          name: 'name',
          validationRules: {required},
          initialValue: this.reportingPeriod.name
        },
        { 
          type: 'date',
          label: 'Reporting Period Start Date',
          name: 'start_date',
          validationRules: {required},
          initialValue: this.reportingPeriod.start_date || today
        },
        { 
          type: 'date',
          label: 'Reporting Period End Date',
          name: 'end_date',
          validationRules: {required},
          initialValue: this.reportingPeriod.end_date || today
        },
        { 
          type: 'text',
          label: 'Upload Template Name',
          name: 'template_filename',
          validationRules: [],
          initialValue: this.reportingPeriod.template_filename,
          readonly: true
        }
      ]
    }
  },
  methods: {
    onSubmit: async function (updatedPeriod) {
      try {
        const result = await post('/api/reporting_periods', { reportingPeriod: updatedPeriod })
        if (result.error) throw new Error(result.error)

        const text = this.isNew
          ? `Period ${updatedPeriod.name} successfully created`
          : `Period ${updatedPeriod.name} successfully updated`

        this.$store.commit('addAlert', {
          text,
          level: 'ok'
        })

        this.$store.dispatch('updateReportingPeriods')
        if (this.isNew) {
          return this.$router.push(`/reporting_periods/${result.reportingPeriod.id}`)
        }
      } catch (e) {
        this.$store.commit('addAlert', {
          text: `Error saving reporting period: ${e.message}`,
          level: 'err'
        })
      }
    },
    onReset () {
      this.formKey = Date.now()
    }
  },
  components: {
    StandardForm
  }
}
</script>

<!-- NOTE: This file was copied from src/views/ReportingPeriod.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
