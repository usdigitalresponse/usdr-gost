<template>
  <div>
    <h2>Subrecipient {{ recipientId }}</h2>

    <div v-if="!recipient" class="spinner-grow text-primary" role="status">
        <span class="sr-only">Loading...</span>
    </div>

    <div v-else>
      <div class="form-group row">
        <div class="col-sm-2">
          Created:
        </div>
        <div class="col-sm-10">
          In
          <router-link :to="`/uploads/${recipient.upload_id}`">
            Upload {{ recipient.upload_id }}
          </router-link>
          on {{ humanDate(recipient.created_at) }}
          by {{ recipient.created_by }}
        </div>
      </div>

      <div class="form-group row">
        <div class="col-sm-2">
          Updated:
        </div>
        <div class="col-sm-10">
          <span v-if="!recipient.updated_at">Never manually updated</span>
          <span v-else>
            By {{ recipient.updated_by_email }} on {{ humanDate(recipient.updated_at) }}
          </span>
        </div>
      </div>

      <StandardForm :initialRecord="JSON.parse(recipient.record)" :cols="cols" @save="updateRecipient" @reset="loadRecipient" />
    </div>
  </div>
</template>

<script>
import moment from 'moment'

import StandardForm from '../components/StandardForm'
import { getJson, post } from '../store/index'

export default {
  name: 'Subrecipient',
  data: function () {
    return {
      recipient: null,
      rules: [],
      saving: false
    }
  },
  computed: {
    recipientId: function () {
      return Number(this.$route.params.id)
    },
    createdAtStr: function () {
      return this.recipient && moment(this.recipient.created_at).local().format('MMM Do YYYY, h:mm:ss A')
    },
    cols: function () {
      return Object.values(this.rules).map(rule => {
        const selectItems = [{ label: '', value: null }].concat(
          rule.listVals.map(val => ({ label: val, value: val }))
        )

        return {
          label: rule.humanColName,
          field: rule.key,
          readonly: rule.key === 'Unique_Entity_Identifier__c' || rule.key === 'EIN__c',
          required: rule.required === true,
          selectItems: rule.listVals.length ? selectItems : null
        }
      })
    }
  },
  methods: {
    loadRecipient: async function () {
      this.recipient = null

      const result = await getJson(`/api/subrecipients/${this.recipientId}`)
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadRecipient Error (${result.status}): ${result.error}`,
          level: 'err'
        })
      } else {
        this.recipient = result.recipient
        this.rules = result.rules
      }
    },
    updateRecipient: async function (updatedRecipient) {
      this.saving = true

      // omit all undefined fields
      // this is due to the way we parse the record initially, where these are also omitted
      const filteredRecipient = Object.fromEntries(
        Object.entries(updatedRecipient)
          .filter(([key, val]) => val !== null && val !== undefined)
      )

      // invariant is also enforced serv-erside
      filteredRecipient.Unique_Entity_Identifier__c = this.recipient.uei
      filteredRecipient.EIN__c = this.recipient.tin

      try {
        const record = JSON.stringify(filteredRecipient)
        const result = await post(`/api/subrecipients/${this.recipientId}`, { record })
        if (result.error) throw new Error(result.error)

        this.$store.commit('addAlert', {
          text: `Recipient ${this.recipientId} successfully updated`,
          level: 'ok'
        })

        this.loadRecipient()
      } catch (err) {
        this.$store.commit('addAlert', {
          text: `Error updating recipient ${this.recipientId}: ${err.message}`,
          level: 'err'
        })
      }

      this.saving = false
    },
    isReadOnly: function (key) {
      return key === 'Unique_Entity_Identifier__c' || key === 'EIN__c'
    },
    humanDate: function (date) {
      return date && moment(date).local().format('MMM Do YYYY, h:mm:ss A')
    }
  },
  mounted: async function () {
    this.loadRecipient()
  },
  watch: {
    recipientId: function (to, from) {
      this.loadRecipient()
    }
  },
  components: {
    StandardForm
  }
}
</script>

<!-- NOTE: This file was copied from src/views/Subrecipient.vue (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z -->
