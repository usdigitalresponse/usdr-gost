<template>
  <section>
    <div v-if="loading">
      Loading...
    </div>
    <div v-if="!currentGrant && !loading">
      No grant found
    </div>
    <b-container
      v-if="currentGrant && !loading"
      fluid
    >
      <div class="grant-details-container">
        <div class="grant-details-back-link">
          <router-link
            v-if="isFirstPageLoad"
            :to="{ name: 'grants' }"
          >
            Browse Grants
          </router-link>
          <a
            v-else
            href="#"
            @click="$router.back()"
          >Back</a>
        </div>
        <!-- Left page column: headline -->
        <h2 class="grant-details-headline m-0">
          {{ currentGrant.title }}
        </h2>

        <!-- Left page column: table data, and grant description -->
        <div class="grant-details-content">
          <b-table
            class="grant-details-table mb-5"
            :items="tableData"
            :fields="[
              {key: 'name', class: 'color-gray grants-details-table-fit-content'},
              {key: 'value', class: 'font-weight-bold'},
            ]"
            thead-class="d-none"
            borderless
            hover
          >
            <template #cell()="data">
              <span :class="{'text-muted font-weight-normal': data.item.displayMuted}">
                {{ data.value }}
              </span>
            </template>
          </b-table>
          <h3 class="mb-3">
            Description
          </h3>
          <!-- eslint-disable vue/no-v-html -- TODO: spike on removing v-html usage https://github.com/usdigitalresponse/usdr-gost/issues/2572 -->
          <div
            style="white-space: pre-line"
            v-html="currentGrant.description"
          />
        </div>

        <!-- Right page column: main print/copy/grants.gov buttons -->
        <div class="grant-details-main-actions print-d-none">
          <b-button
            variant="primary"
            block
            class="mb-3"
            :href="`https://www.grants.gov/search-results-detail/${currentGrant.grant_id}`"
            target="_blank"
            rel="noopener noreferrer"
            data-dd-action-name="view on grants.gov"
            @click="onOpenGrantsGov"
          >
            <b-icon
              icon="box-arrow-up-right"
              aria-hidden="true"
              class="mr-2"
            />
            Apply on Grants.gov
          </b-button>
          <div class="d-flex">
            <b-button
              class="w-50 flex-shrink-1 mr-3"
              variant="outline-primary"
              data-dd-action-name="print btn"
              @click="printPage"
            >
              <b-icon
                icon="printer-fill"
                aria-hidden="true"
                class="mr-2"
              />
              Print
            </b-button>
            <b-button
              class="w-50 flex-shrink-1"
              :variant="copyUrlSuccessTimeout === null ? 'outline-primary' : 'outline-success'"
              data-dd-action-name="copy btn"
              @click="copyUrl"
            >
              <b-icon
                :icon="copyUrlSuccessTimeout === null ? 'files' : 'check2'"
                aria-hidden="true"
                class="mr-2"
              />
              <span v-if="copyUrlSuccessTimeout === null">Copy Link</span>
              <span v-else>Link Copied</span>
            </b-button>
          </div>
        </div>

        <!-- Right page column: secondary assign grant section -->
        <div class="grant-details-secondary-actions">
          <!-- Assign grant section -->
          <div class="mb-5">
            <h3 class="mb-3">
              Assign Grant
            </h3>
            <div class="d-flex print-d-none">
              <v-select
                v-model="selectedAgencyToAssign"
                class="flex-grow-1 mr-3"
                :options="unassignedAgencies"
                label="name"
                track-by="id"
                :placeholder="`Choose ${newTerminologyEnabled ? 'team': 'agency'}`"
                :clearable="false"
                data-dd-action-name="select team for grant assignment"
                @close="$refs.assignSubmitButton.focus()"
              />
              <b-button
                ref="assignSubmitButton"
                variant="outline-primary"
                :disabled="!selectedAgencyToAssign"
                data-dd-action-name="assign team"
                @click="assignAgenciesToGrant"
              >
                Submit
              </b-button>
            </div>
            <div
              v-for="agency in assignedAgencies"
              :key="agency.id"
              class="d-flex justify-content-between align-items-start my-3"
            >
              <div class="mr-3">
                <p class="m-0">
                  {{ agency.name }}
                </p>
                <p class="m-0 text-muted">
                  <small>{{ formatDateTime(agency.created_at) }}</small>
                </p>
              </div>
              <b-button-close
                data-dd-action-name="remove team assignment"
                class="print-d-none"
                @click="unassignAgenciesToGrant(agency)"
              />
            </div>
          </div>

          <!-- Team status section -->
          <div class="mb-5">
            <h3 class="mb-3">
              {{ newTerminologyEnabled ? 'Team': 'Agency' }} Status
            </h3>
            <div class="d-flex print-d-none">
              <v-select
                v-model="selectedInterestedCode"
                class="flex-grow-1 mr-3"
                :reduce="(option) => option.id"
                :options="interestedOptions"
                label="name"
                track-by="id"
                placeholder="Choose status"
                :selectable="selectableOption"
                :clearable="false"
                data-dd-action-name="select team status"
                @close="$refs.statusSubmitButton.focus()"
              />
              <b-button
                ref="statusSubmitButton"
                variant="outline-primary"
                :disabled="!selectedInterestedCode"
                data-dd-action-name="submit team status"
                @click="markGrantAsInterested"
              >
                Submit
              </b-button>
            </div>
            <div
              v-for="agency in visibleInterestedAgencies"
              :key="agency.id"
              class="d-flex justify-content-between align-items-start my-3"
            >
              <UserAvatar
                :user-name="agency.user_name"
                :color="agency.user_avatar_color"
                size="2.5rem"
              />
              <div class="mx-3">
                <p class="m-0">
                  <strong>{{ agency.user_name }}</strong> updated
                  <strong>{{ agency.agency_name }}</strong> team status to
                  <strong>{{ agency.interested_code_name }}</strong>
                </p>
                <p v-if="agency.user_email">
                  <small>
                    <CopyButton :copy-text="agency.user_email">
                      {{ agency.user_email }}
                    </CopyButton>
                  </small>
                </p>
              </div>
              <b-button-close
                data-dd-action-name="remove team status"
                class="print-d-none"
                @click="unmarkGrantAsInterested(agency)"
              />
            </div>
          </div>
        </div>
      </div>
    </b-container>
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { datadogRum } from '@datadog/browser-rum';
import { debounce } from 'lodash';
import { newTerminologyEnabled } from '@/helpers/featureFlags';
import { formatCurrency } from '@/helpers/currency';
import { titleize } from '@/helpers/form-helpers';
import { gtagEvent } from '@/helpers/gtag';
import { DateTime } from 'luxon';
import UserAvatar from '@/components/UserAvatar.vue';
import CopyButton from '@/components/CopyButton.vue';

const HEADER = '__HEADER__';
const FAR_FUTURE_CLOSE_DATE = '2100-01-01';
const NOT_AVAILABLE_TEXT = 'Not available';

export default {
  components: {
    UserAvatar,
    CopyButton,
  },
  beforeRouteEnter(to, from, next) {
    const isFirstPageLoad = from.name === null && from.path === '/';
    next((vm) => {
      if (isFirstPageLoad) {
        vm.setFirstPageLoad();
      }
    });
  },
  data() {
    return {
      isFirstPageLoad: false,
      orderBy: '',
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
      selectedAgencyToAssign: null,
      selectedInterestedCode: null,
      searchInput: null,
      debouncedSearchInput: null,
      loading: true,
      copyUrlSuccessTimeout: null,
    };
  },
  computed: {
    ...mapGetters({
      agency: 'users/agency',
      selectedAgencyId: 'users/selectedAgencyId',
      agencies: 'agencies/agencies',
      currentTenant: 'users/currentTenant',
      users: 'users/users',
      interestedCodes: 'grants/interestedCodes',
      loggedInUser: 'users/loggedInUser',
      selectedAgency: 'users/selectedAgency',
      currentGrant: 'grants/currentGrant',
    }),
    grantId() {
      return this.$route.params.id;
    },
    interestedOptions() {
      return [
        { name: 'Interested', status_code: HEADER },
        ...this.interestedCodes.interested,
        { name: 'Applied', status_code: HEADER },
        ...this.interestedCodes.result,
        { name: 'Not Applying', status_code: HEADER },
        ...this.interestedCodes.rejections,
      ];
    },
    tableData() {
      return [{
        name: 'Opportunity Number',
        value: this.currentGrant.grant_number,
      }, {
        name: 'Open Date',
        value: this.formatDate(this.currentGrant.open_date),
      }, {
        name: 'Close Date',
        value: this.closeDateDisplay,
        displayMuted: this.closeDateDisplayMuted,
      }, {
        name: 'Grant ID',
        value: this.currentGrant.grant_id,
      }, {
        name: 'Agency Code',
        value: this.currentGrant.agency_code,
      }, {
        name: 'Award Ceiling',
        value: formatCurrency(this.currentGrant.award_ceiling),
      }, {
        name: 'Category of Funding Activity',
        value: this.currentGrant.funding_activity_categories?.join(', '),
      }, {
        name: 'Opportunity Category',
        value: this.currentGrant.opportunity_category,
      }, {
        name: 'Opportunity Status',
        value: titleize(this.currentGrant.opportunity_status),
      }, {
        name: 'Appropriation Bill',
        value: this.currentGrant.bill,
      }, {
        name: 'Cost Sharing',
        value: this.currentGrant.cost_sharing,
      },
      ];
    },
    closeDateDisplay() {
      // If we have an explainer text instead of a real close date, display that instead
      if (this.currentGrant.close_date === FAR_FUTURE_CLOSE_DATE) {
        return this.currentGrant.close_date_explanation ?? NOT_AVAILABLE_TEXT;
      }
      return this.formatDate(this.currentGrant.close_date);
    },
    closeDateDisplayMuted() {
      return this.currentGrant.close_date === FAR_FUTURE_CLOSE_DATE && !this.currentGrant.close_date_explanation;
    },
    visibleInterestedAgencies() {
      return this.currentGrant.interested_agencies
        .filter((agency) => String(agency.agency_id) === this.selectedAgencyId || this.isAbleToUnmark(agency.agency_id));
    },
    alreadyViewed() {
      if (!this.currentGrant) {
        return false;
      }
      return this.currentGrant.viewed_by_agencies.find(
        (viewed) => viewed.agency_id.toString() === this.selectedAgencyId,
      );
    },
    interested() {
      if (!this.currentGrant) {
        return undefined;
      }
      return this.currentGrant.interested_agencies.find(
        (interested) => interested.agency_id.toString() === this.selectedAgencyId,
      );
    },
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
    unassignedAgencies() {
      return this.agencies.filter(
        (agency) => !this.assignedAgencies.map((assigned) => assigned.id).includes(agency.id),
      );
    },
  },
  watch: {
    async currentGrant() {
      if (this.currentGrant) {
        this.fetchAgencies();
        if (!this.alreadyViewed) {
          try {
            await this.markGrantAsViewed();
          } catch (e) {
            console.log(e);
          }
        }
        this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.currentGrant.grant_id });
      }
    },
  },
  created() {
    // watch the params of the route to fetch the data again
    this.$watch(
      () => this.$route.params,
      () => {
        this.loading = true;
        this.fetchData().then(() => {
          this.loading = false;
        });
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true },
    );
  },
  methods: {
    ...mapActions({
      markGrantAsViewedAction: 'grants/markGrantAsViewed',
      markGrantAsInterestedAction: 'grants/markGrantAsInterested',
      unmarkGrantAsInterestedAction: 'grants/unmarkGrantAsInterested',
      getInterestedAgencies: 'grants/getInterestedAgencies',
      getGrantAssignedAgencies: 'grants/getGrantAssignedAgencies',
      assignAgenciesToGrantAction: 'grants/assignAgenciesToGrant',
      unassignAgenciesToGrantAction: 'grants/unassignAgenciesToGrant',
      fetchAgencies: 'agencies/fetchAgencies',
      fetchGrantDetails: 'grants/fetchGrantDetails',
    }),
    titleize,
    formatCurrency,
    debounceSearchInput: debounce(function bounce(newVal) {
      this.debouncedSearchInput = newVal;
    }, 500),
    setFirstPageLoad() {
      this.isFirstPageLoad = true;
    },
    async markGrantAsViewed() {
      await this.markGrantAsViewedAction({ grantId: this.currentGrant.grant_id, agencyId: this.selectedAgencyId });
    },
    async markGrantAsInterested() {
      if (this.selectedInterestedCode !== null) {
        const existingAgencyRecord = this.interested;
        if (existingAgencyRecord) {
          await this.unmarkGrantAsInterested(existingAgencyRecord);
        }
        await this.markGrantAsInterestedAction({
          grantId: this.currentGrant.grant_id,
          agencyId: this.selectedAgencyId,
          interestedCode: this.selectedInterestedCode,
        });
        const eventName = 'submit team status for grant';
        const eventParams = {
          status_name: this.interestedOptions.find((option) => option.id === this.selectedInterestedCode)?.name,
        };
        gtagEvent(eventName, eventParams);
        datadogRum.addAction(eventName, eventParams);
        this.selectedInterestedCode = null;
      }
    },
    async unmarkGrantAsInterested(agency) {
      await this.unmarkGrantAsInterestedAction({
        grantId: this.currentGrant.grant_id,
        agencyIds: [agency.agency_id],
        interestedCode: agency.interested_code_id,
      });
      this.currentGrant.interested_agencies = await this.getInterestedAgencies({ grantId: this.currentGrant.grant_id });
      const eventName = 'remove team status for grant';
      gtagEvent(eventName);
      datadogRum.addAction(eventName);
    },
    async assignAgenciesToGrant() {
      await this.assignAgenciesToGrantAction({
        grantId: this.currentGrant.grant_id,
        agencyIds: this.assignedAgencies.map((agency) => agency.id).concat(this.selectedAgencyToAssign.id),
      });
      const eventName = 'assign team to grant';
      gtagEvent(eventName);
      datadogRum.addAction(eventName);
      this.selectedAgencyToAssign = null;
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.currentGrant.grant_id });
    },
    async unassignAgenciesToGrant(agency) {
      await this.unassignAgenciesToGrantAction({
        grantId: this.currentGrant.grant_id,
        agencyIds: [agency.id],
      });
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.currentGrant.grant_id });
      const eventName = 'remove team assignment from grant';
      gtagEvent(eventName);
      datadogRum.addAction(eventName);
    },
    isAbleToUnmark(agencyId) {
      return this.agencies.some((agency) => agency.id === agencyId);
    },
    async fetchData() {
      await this.fetchGrantDetails({ grantId: this.grantId });
    },
    copyUrl() {
      gtagEvent('copy btn clicked');
      navigator.clipboard.writeText(window.location.href);

      // Show the success indicator
      // (Clear previous timeout to ensure multiple clicks in quick succession don't cause issues)
      clearTimeout(this.copyUrlSuccessTimeout);
      this.copyUrlSuccessTimeout = setTimeout(
        () => { this.copyUrlSuccessTimeout = null; },
        1000,
      );
    },
    printPage() {
      gtagEvent('print btn clicked');
      window.print();
    },
    onOpenGrantsGov() {
      // Note that we can execute this as a side effect of clicking on the outbound link only because it's set to
      // load in a new tab. If it opened in the same tab, it would open the new URL before the event is logged.
      gtagEvent('grants.gov btn clicked');
    },
    formatDate(dateString) {
      return DateTime.fromISO(dateString).toLocaleString(DateTime.DATE_MED);
    },
    formatDateTime(dateString) {
      return DateTime.fromISO(dateString).toLocaleString(DateTime.DATETIME_MED);
    },
    selectableOption(option) {
      return option.status_code !== HEADER;
    },
  },
};
</script>

<style lang="css">
.grant-details-container {
  padding-right: 80px;
  padding-left: 80px;
  padding-bottom: 80px;
  display: grid;
  grid-template-columns: 1fr 437px;
  grid-template-rows: 50px auto auto;
  grid-template-areas:
    "back-link back-link"
    "headline  main-actions"
    "content   secondary-actions";
  column-gap: 90px;
  row-gap: 48px;
  .grant-details-back-link {
    grid-area: back-link;
    margin-top: 28px;
    margin-bottom: 5px;
    font-size: 14px;
    font-weight: 700;
    color: #6d7278;
    a {
      color: #6d7278;
      cursor: pointer;
      &::hover {
        text-decoration: underline;
      }
    }
  }

  .grant-details-headline {
    grid-area: headline;
    align-self: start;
  }

  .grant-details-content {
    grid-area: content;
  }

  .grant-details-main-actions {
    grid-area: main-actions;
  }

  .grant-details-secondary-actions {
    grid-area: secondary-actions;
  }

  .grant-details-table tr:nth-of-type(odd) {
    /* Design color differs from default bootstrap, so making our own striped background here */
    background-color: #f9f9f9;
  }

  .grants-details-table-fit-content {
    /* Make a table column that's the width of its content */
    white-space: nowrap;
    width: 1%;
  }
}

@media print {
  .print-d-none {
    display: none !important; /* important to override other styles like `d-flex` */
  }
  .grants-details-sidebar {
    flex-basis: 30%; /* don't want the sidebar taking over the page in print */
  }
}
</style>
