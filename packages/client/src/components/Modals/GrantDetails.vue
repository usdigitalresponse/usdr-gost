<template>
    <b-modal v-model="showDialog"
    ok-only
    :title="selectedGrant && selectedGrant.title"
    @hide="resetSelectedGrant"
    scrollable
    size="lg"
    header-bg-variant="primary"
    header-text-variant="light"
    body-bg-variant="light"
    body-text-variant="dark"
    footer-bg-variant="dark"
    footer-text-variant="light">
    <div v-if="selectedGrant">
      <b-row>
        <b-col cols="9">
          <h3>Grant Number: {{selectedGrant.grant_number}}</h3>
        </b-col>
        <b-col cols="3" class="text-right">
          <b-button
            :href="`https://www.grants.gov/web/grants/view-opportunity.html?oppId=${selectedGrant.grant_id}`"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary">
            Grants.Gov <b-icon icon="link" aria-hidden="true"></b-icon>
          </b-button>
        </b-col>
      </b-row>
      <p><span style="font-weight:bold">Valid from:</span> {{new Date(selectedGrant.open_date).toLocaleDateString('en-US')}}-{{new Date(selectedGrant.close_date).toLocaleDateString('en-US')}}</p>
      <div v-for="field in dialogFields" :key="field">
        <p><span style="font-weight:bold">{{titleize(field)}}:</span> {{selectedGrant[field]}}</p>
      </div>
      <h6>Description</h6>
      <div style="max-height: 170px; overflow-y: scroll">
        <div style="white-space: pre-line" v-html="selectedGrant.description"></div>
      </div>
      <br/>
      <b-row>
        <b-col>
          <h4>Interested Agencies</h4>
        </b-col>
        <b-col class="text-right">
          <b-row v-if="!interested">
            <b-col cols="9">
              <b-form-select v-model="selectedInterestedCode">
                <b-form-select-option-group label="Interested">
                  <b-form-select-option v-for="code in interestedCodes.interested"  :key="code.id" :value="code.id">{{code.name}}</b-form-select-option>
                </b-form-select-option-group>
                <b-form-select-option-group label="Rejections">
                  <b-form-select-option v-for="code in interestedCodes.rejections"  :key="code.id" :value="code.id">{{code.name}}</b-form-select-option>
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
      <br/>
      <b-table
        :items="selectedGrant.interested_agencies"
        :fields="interestedAgenciesFields"
      />
      <b-row>
        <b-col>
          <h4>Assigned Users</h4>
        </b-col>
      </b-row>
      <br/>
      <b-row>
        <b-col>
          <multiselect v-model="selectedUsers" :options="users"
          :multiple="true" :close-on-select="false"
          :clear-on-select="false"
          placeholder="Select users" label="name"
          track-by="id">
          </multiselect>
        </b-col>
        <b-col>
          <b-button variant="outline-success" @click="assignUsersToGrant">Assign</b-button>
        </b-col>
      </b-row>
      <b-table
        :items="assignedUsers"
        :fields="assignedUsersFields"
      >
      <template #cell(actions)="row">
        <b-button variant="danger" class="mr-1" size="sm" @click="unassignUsersToGrant(row)">
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

import { titleize } from '@/helpers/form-helpers';

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
        },
        {
          key: 'agency_abbreviation',
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
      ],
      assignedUsersFields: [
        {
          key: 'name',
        },
        {
          key: 'email',
        },
        {
          key: 'created_at',
        },
        { key: 'actions', label: 'Actions' },
      ],
      assignedUsers: [],
      selectedUsers: [],
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
      users: 'users/users',
      interestedCodes: 'grants/interestedCodes',
    }),
    alreadyViewed() {
      if (!this.selectedGrant) {
        return false;
      }
      return this.selectedGrant.viewed_by_agencies.find((viewed) => viewed.agency_id === this.agency.id);
    },
    interested() {
      if (!this.selectedGrant) {
        return false;
      }
      return this.selectedGrant.interested_agencies.find((interested) => interested.agency_id === this.agency.id);
    },
  },
  watch: {
    async selectedGrant() {
      this.showDialog = Boolean(this.selectedGrant);
      if (this.selectedGrant) {
        // if users have not been loaded, load them
        if (!this.users.length) {
          this.fetchUsers();
        }
        if (!this.alreadyViewed) {
          this.markGrantAsViewed();
        }
        this.assignedUsers = await this.getGrantAssignedUsers({ grantId: this.selectedGrant.grant_id });
      }
    },
  },
  methods: {
    ...mapActions({
      markGrantAsViewedAction: 'grants/markGrantAsViewed',
      generateGrantForm: 'grants/generateGrantForm',
      markGrantAsInterestedAction: 'grants/markGrantAsInterested',
      getGrantAssignedUsers: 'grants/getGrantAssignedUsers',
      assignUsersToGrantAction: 'grants/assignUsersToGrant',
      unassignUsersToGrantAction: 'grants/unassignUsersToGrant',
      fetchUsers: 'users/fetchUsers',
    }),
    titleize,
    debounceSearchInput: debounce(function bounce(newVal) {
      this.debouncedSearchInput = newVal;
    }, 500),
    async markGrantAsViewed() {
      await this.markGrantAsViewedAction({ grantId: this.selectedGrant.grant_id, agencyId: this.agency.id });
    },
    async markGrantAsInterested() {
      if (this.selectedInterestedCode !== null) {
        await this.markGrantAsInterestedAction({
          grantId: this.selectedGrant.grant_id,
          agencyId: this.agency.id,
          interestedCode: this.selectedInterestedCode,
        });
      }
    },
    async assignUsersToGrant() {
      const userIds = this.selectedUsers.map((user) => user.id);
      await this.assignUsersToGrantAction({
        grantId: this.selectedGrant.grant_id,
        userIds,
      });
      this.selectedUsers = [];
      this.assignedUsers = await this.getGrantAssignedUsers({ grantId: this.selectedGrant.grant_id });
    },
    async unassignUsersToGrant(row) {
      await this.unassignUsersToGrantAction({
        grantId: this.selectedGrant.grant_id,
        userIds: [row.item.id],
      });
      this.assignedUsers = await this.getGrantAssignedUsers({ grantId: this.selectedGrant.grant_id });
    },
    async generateSpoc() {
      await this.generateGrantForm({
        grantId: this.selectedGrant.grant_id,
      });
    },
    resetSelectedGrant() {
      this.$emit('update:selectedGrant', null);
      this.assignedUsers = [];
      this.selectedUsers = [];
    },
  },
};
</script>
