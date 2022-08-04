<!-- eslint-disable max-len -->
<template>
  <b-modal v-model="showDialog" ok-only :title="selectedGrant && selectedGrant.title" @hide="resetSelectedGrant"
    scrollable size="lg" header-bg-variant="primary" header-text-variant="light" body-bg-variant="light"
    body-text-variant="dark" footer-bg-variant="dark" footer-text-variant="light">
    <div v-if="selectedGrant">
      <b-row>
        <b-col cols="9">
          <h3>Grant Number: {{ selectedGrant.grant_number }}</h3>
        </b-col>
        <b-col cols="3" class="text-right">
          <b-button :href="`https://www.grants.gov/web/grants/view-opportunity.html?oppId=${selectedGrant.grant_id}`"
            target="_blank" rel="noopener noreferrer" variant="primary">
            Grants.Gov <b-icon icon="link" aria-hidden="true"></b-icon>
          </b-button>
        </b-col>
      </b-row>
      <p><span style="font-weight:bold">Valid from:</span> {{ new
          Date(selectedGrant.open_date).toLocaleDateString('en-US')
      }}-{{ new
    Date(selectedGrant.close_date).toLocaleDateString('en-US')
}}</p>
      <div v-for="field in dialogFields" :key="field">
        <p><span style="font-weight:bold">{{ titleize(field) }}:</span> {{ selectedGrant[field] }}</p>
      </div>
      <h6>Description</h6>
      <div style="max-height: 170px; overflow-y: scroll">
        <div style="white-space: pre-line" v-html="selectedGrant.description"></div>
      </div>
      <br />
      <b-row>
        <b-col>
          <h4>Interested Agencies</h4>
        </b-col>
        <b-col class="text-right">
          <b-row v-if="!interested">
            <b-col cols="9">
              <b-form-select v-model="selectedInterestedCode">
                <b-form-select-option-group label="Interested">
                  <b-form-select-option v-for="code in interestedCodes.interested" :key="code.id" :value="code.id">
                    {{ code.name }}</b-form-select-option>
                </b-form-select-option-group>
                <b-form-select-option-group label="Rejections">
                  <b-form-select-option v-for="code in interestedCodes.rejections" :key="code.id" :value="code.id">
                    {{ code.name }}</b-form-select-option>
                </b-form-select-option-group>
              </b-form-select>
            </b-col>
            <b-col cols="3" class="text-right">
              <b-button variant="outline-success" @click="markGrantAsInterested">Submit</b-button>
            </b-col>
          </b-row>
          <b-row v-if="interested && !interested.interested_is_rejection">
            <b-col>
              <b-button variant="primary" @click="generateSpoc">Generate SPOC</b-button>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
      <br />
      <b-table :items="selectedGrant.interested_agencies" :fields="interestedAgenciesFields">
        <template #cell(actions)="row">
          <b-row
            v-if="(String(row.item.agency_id) === selectedAgencyId) || isAbleToUnmark(row.item.agency_id)">
            <b-button variant="danger" class="mr-1" size="sm" @click="unmarkGrantAsInterested(row)">
              <b-icon icon="trash-fill" aria-hidden="true"></b-icon>
            </b-button>
          </b-row>
        </template>
      </b-table>
      <b-row>
        <b-col>
          <h4>Assigned Agencies</h4>
        </b-col>
      </b-row>
      <br />
      <b-row>
        <b-col>
          <multiselect v-model="selectedAgencies" :options="agencies" :multiple="true" :close-on-select="false"
            :clear-on-select="false" placeholder="Select agencies" label="name" track-by="id">
          </multiselect>
        </b-col>
        <b-col>
          <b-button variant="outline-success" @click="assignAgenciesToGrant">Assign</b-button>
        </b-col>
      </b-row>
      <b-table :items="assignedAgencies" :fields="assignedAgenciesFields">
        <template #cell(actions)="row">
          <b-button variant="danger" class="mr-1" size="sm" @click="unassignAgenciesToGrant(row)">
            <b-icon icon="trash-fill" aria-hidden="true"></b-icon>
          </b-button>
        </template>
      </b-table>
    </div>
  </b-modal>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { debounce } from 'lodash';
import Multiselect from 'vue-multiselect';
import { titleize } from '../../helpers/form-helpers';

export default {
  components: { Multiselect },
  props: {
    selectedGrant: Object,
  },
  data() {
    return {
      showDialog: false,
      dialogFields: ['grant_id', 'agency_code', 'award_ceiling', 'cfda_list', 'opportunity_category'],
      orderBy: '',
      interestedAgenciesFields: [
        {
          key: 'agency_name',
          label: 'Agency',
        },
        {
          key: 'agency_abbreviation',
          label: 'Abbreviation',
        },
        {
          label: 'Name',
          key: 'user_name',
        },
        {
          label: 'Email',
          key: 'user_email',
        },
        {
          label: 'Interested Code',
          key: 'interested_code_name',
        },
        {
          key: 'actions',
          label: 'Actions',
        },
      ],
      assignedAgenciesFields: [
        {
          key: 'name',
        },
        {
          key: 'abbreviation',
          label: 'Abbreviation',
        },
        {
          key: 'created_at',
        },
        {
          key: 'actions',
          label: 'Actions',
        },
      ],
      assignedAgencies: [],
      selectedAgencies: [],
      selectedInterestedCode: null,
      searchInput: null,
      debouncedSearchInput: null,
    };
  },
  mounted() {
  },
  computed: {
    ...mapGetters({
      agency: 'users/agency',
      selectedAgencyId: 'users/selectedAgencyId',
      agencies: 'agencies/agencies',
      users: 'users/users',
      interestedCodes: 'grants/interestedCodes',
      loggedInUser: 'users/loggedInUser',
      selectedAgency: 'users/selectedAgency',
    }),
    alreadyViewed() {
      if (!this.selectedGrant) {
        return false;
      }
      return this.selectedGrant.viewed_by_agencies.find((viewed) => viewed.agency_id.toString() === this.selectedAgencyId);
    },
    interested() {
      if (!this.selectedGrant) {
        return false;
      }
      return this.selectedGrant.interested_agencies.find((interested) => interested.agency_id.toString() === this.selectedAgencyId);
    },
  },
  watch: {
    async selectedGrant() {
      this.showDialog = Boolean(this.selectedGrant);
      if (this.selectedGrant) {
        this.fetchAgencies();
        if (!this.alreadyViewed) {
          try {
            await this.markGrantAsViewed();
          } catch (e) {
            console.log(e);
          }
        }
        this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.selectedGrant.grant_id });
      }
    },
  },
  methods: {
    ...mapActions({
      markGrantAsViewedAction: 'grants/markGrantAsViewed',
      generateGrantForm: 'grants/generateGrantForm',
      markGrantAsInterestedAction: 'grants/markGrantAsInterested',
      unmarkGrantAsInterestedAction: 'grants/unmarkGrantAsInterested',
      getInterestedAgencies: 'grants/getInterestedAgencies',
      getGrantAssignedAgencies: 'grants/getGrantAssignedAgencies',
      assignAgenciesToGrantAction: 'grants/assignAgenciesToGrant',
      unassignAgenciesToGrantAction: 'grants/unassignAgenciesToGrant',
      fetchUsers: 'users/fetchUsers',
      fetchAgencies: 'agencies/fetchAgencies',
    }),
    titleize,
    debounceSearchInput: debounce(function bounce(newVal) {
      this.debouncedSearchInput = newVal;
    }, 500),
    async markGrantAsViewed() {
      await this.markGrantAsViewedAction({ grantId: this.selectedGrant.grant_id, agencyId: this.selectedAgencyId });
    },
    async markGrantAsInterested() {
      if (this.selectedInterestedCode !== null) {
        await this.markGrantAsInterestedAction({
          grantId: this.selectedGrant.grant_id,
          agencyId: this.selectedAgencyId,
          interestedCode: this.selectedInterestedCode,
        });
      }
    },
    async unmarkGrantAsInterested(row) {
      await this.unmarkGrantAsInterestedAction({
        grantId: this.selectedGrant.grant_id,
        agencyIds: [row.item.agency_id],
        interestedCode: this.selectedInterestedCode,
      });
      this.selectedGrant.interested_agencies = await this.getInterestedAgencies({ grantId: this.selectedGrant.grant_id });
    },
    async assignAgenciesToGrant() {
      const agencyIds = this.selectedAgencies.map((agency) => agency.id);
      await this.assignAgenciesToGrantAction({
        grantId: this.selectedGrant.grant_id,
        agencyIds,
      });
      this.selectedAgencies = [];
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.selectedGrant.grant_id });
    },
    async unassignAgenciesToGrant(row) {
      await this.unassignAgenciesToGrantAction({
        grantId: this.selectedGrant.grant_id,
        agencyIds: [row.item.id],
      });
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.selectedGrant.grant_id });
    },
    async generateSpoc() {
      await this.generateGrantForm({
        grantId: this.selectedGrant.grant_id,
      });
    },
    isAbleToUnmark(agencyId) {
      return this.agencies.some((agency) => agency.id === agencyId);
    },
    resetSelectedGrant() {
      this.$emit('update:selectedGrant', null);
      this.assignedAgencies = [];
      this.selectedAgencies = [];
    },
  },
};
</script>
