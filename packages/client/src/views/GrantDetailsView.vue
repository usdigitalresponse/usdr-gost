<template>
  <div class="background">
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
          <div>
            <b-card class="p-4">
              <div class="mb-5">
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
                <h2 class="grant-details-headline mt-3 mb-4">
                  {{ currentGrant.title }}
                </h2>

                <!-- Left page column: main print/copy/grants.gov buttons -->
                <div class="grant-details-main-actions print-d-none ml-0">
                  <div class="d-flex justify-content-between align-items-center">
                    <b-button
                      variant="primary"
                      class="mr-4 text-nowrap"
                      :href="`https://www.grants.gov/search-results-detail/${currentGrant.grant_id}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      data-dd-action-name="view on grants.gov"
                      @click="onOpenGrantsGov"
                    >
                      <b-icon
                        icon="box-arrow-up-right"
                        aria-hidden="true"
                        class="mr-2"
                      />
                      View on Grants.gov
                    </b-button>
                    <div class="w-20 d-flex">
                      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/interactive-supports-focus -->
                      <a
                        class="link-primary text-nowrap"
                        role="button"
                        :variant="copyUrlSuccessTimeout === null ? 'outline-primary' : 'outline-success'"
                        data-dd-action-name="copy btn"
                        @click="copyUrl"
                      >
                        <b-icon
                          :icon="copyUrlSuccessTimeout === null ? 'paperclip' : 'check2'"
                          aria-hidden="true"
                          class="mr-1"
                        />
                        <span v-if="copyUrlSuccessTimeout === null">Copy Link</span>
                        <span v-else>Link Copied</span>
                      </a>
                      <div class="col-1 border-right border-dark p-2" />
                      <div class="col-1 p-2" />
                      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/interactive-supports-focus -->
                      <a
                        class="link-primary text-nowrap"
                        role="button"
                        variant="outline-primary"
                        data-dd-action-name="print btn"
                        @click="printPage"
                      >
                        <b-icon
                          icon="printer"
                          aria-hidden="true"
                          class="mr-1"
                        />
                        Print
                      </a>
                    </div>
                  </div>
                </div>

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
              </div>
            </b-card>
          </div>

          <!-- Right page column: secondary assign grant section -->
          <div class="grant-details-secondary-actions">
            <GrantActivity
              v-if="followNotesEnabled"
              class="mb-3"
            />
            <!-- Team status section -->
            <b-card
              v-if="!followNotesEnabled"
              class="mb-3"
            >
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
                    :disabled="statusSubmitButtonDisabled"
                    data-dd-action-name="submit team status"
                    @click="markGrantAsInterested"
                  >
                    Submit
                  </b-button>
                </div>
                <div
                  v-for="agency in visibleInterestedAgencies"
                  :key="agency.id"
                  class="d-flex justify-content-between align-items-start my-4"
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
                    <p
                      v-if="agency.user_email"
                      class="email-paragraph"
                    >
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
            </b-card>
            <ShareGrant class="mb-3" />
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { datadogRum } from '@datadog/browser-rum';
import { debounce } from 'lodash';
import { newTerminologyEnabled, shareTerminologyEnabled, followNotesEnabled } from '@/helpers/featureFlags';
import { formatCurrency } from '@/helpers/currency';
import { formatDate, formatDateTime } from '@/helpers/dates';
import { titleize } from '@/helpers/form-helpers';
import { gtagEvent } from '@/helpers/gtag';
import UserAvatar from '@/components/UserAvatar.vue';
import CopyButton from '@/components/CopyButton.vue';
import ShareGrant from '@/components/ShareGrant.vue';
import GrantActivity from '@/components/GrantActivity.vue';

const HEADER = '__HEADER__';
const FAR_FUTURE_CLOSE_DATE = '2100-01-01';
const NOT_AVAILABLE_TEXT = 'Not available';

export default {
  components: {
    UserAvatar,
    CopyButton,
    ShareGrant,
    GrantActivity,
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
    newTerminologyEnabled,
    shareTerminologyEnabled,
    followNotesEnabled,
    statusSubmitButtonDisabled() {
      return this.selectedInterestedCode === null;
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
      fetchAgencies: 'agencies/fetchAgencies',
      fetchGrantDetails: 'grants/fetchGrantDetails',
    }),
    titleize,
    formatCurrency,
    formatDate,
    formatDateTime,
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
      const eventName = 'remove team status for grant';
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
    selectableOption(option) {
      return option.status_code !== HEADER;
    },
  },
};
</script>

<style lang="css">
.grant-details-container {
  padding-right: 1.125rem;
  padding-left: 1.125rem;
  padding-bottom: 5rem;
  padding-top: 1rem;
  display: grid;
  grid-template-columns: 1fr 27.3125rem;
  grid-template-rows: 50px auto auto;
  grid-template-areas:
    "back-link secondary-actions"
    "headline  secondary-actions"
    "main-actions secondary-actions"
    "content  secondary-actions";
  column-gap: 1.25rem;
  row-gap: 3rem;
  .grant-details-back-link {
    grid-area: back-link;
    margin-top: 0rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
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
    margin: 12px;
  }

  .grant-details-secondary-actions {
    grid-area: secondary-actions;
    margin-bottom: 1.5rem;
    margin-left: 1rem;
    margin-right: 1rem;
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

.email-paragraph {
  margin: 0rem;
}

.grant-details-container .card {
  border-radius: .5rem !important;
}
.grant-details-container .card .card-header {
  border-top-left-radius: .5rem !important;
  border-top-right-radius: .5rem !important;
}
.grant-details-container .card .card-footer {
  border-bottom-left-radius: .5rem !important;
  border-bottom-right-radius: .5rem !important;
}

.background {
  z-index: -1000;
  top: 0;
  left: 0;
  min-height: 1000px;
  height: 100%;
  background: rgb(244, 247, 249);
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
