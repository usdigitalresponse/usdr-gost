<template>
  <b-table
    hover
    :items="activityItems"
    :fields="activityFields"
    sort-by="dateSort"
    sort-desc
    class="table table-borderless"
    thead-class="d-none"
    selectable
    select-mode="single"
    @row-selected="onRowSelected"
    @row-clicked="onRowClicked"
  >
    <template #cell(icon)="list">
      <div class="gutter-icon row">
        <b-icon
          v-if="list.item.interested === statuses.rejected"
          icon="x-circle-fill"
          scale="1"
          variant="danger"
        />
        <b-icon
          v-if="list.item.interested === statuses.interested"
          icon="check-circle-fill"
          scale="1"
          variant="success"
        />
        <b-icon
          v-if="list.item.interested === statuses.assigned"
          icon="arrow-right-circle-fill"
          scale="1"
        />
        <b-icon
          v-if="list.item.interested === statuses.awarded"
          icon="award-fill"
          scale="1"
          class="color-yellow"
        />
        <b-icon
          v-if="list.item.interested === statuses.applied"
          icon="check-circle-fill"
          scale="1"
          class="color-green"
        />
        <b-iconstack v-if="list.item.interested === statuses.lost">
          <b-icon
            stacked
            icon="award-fill"
            scale="1"
            class="color-yellow"
          />
          <b-icon
            stacked
            icon="x-lg"
            scale="1.2"
          />
        </b-iconstack>
      </div>
    </template>
    <template #cell(agencyAndGrant)="agencies">
      <div v-if="agencies.item.interested !== statuses.assigned">
        {{ agencies.item.agency }}
        <span
          v-if="agencies.item.interested === statuses.rejected"
          class="color-red"
        > <strong> rejected </strong> </span>
        <span v-if="agencies.item.interested === statuses.interested"> is
          <span class="color-green">
            <strong> interested </strong>
          </span> in
        </span>
        <span v-if="agencies.item.interested === statuses.awarded"> was<strong><span
          class="color-yellow"
        > awarded </span></strong> </span>
        <span v-if="agencies.item.interested === statuses.applied"><strong><span
          class="color-green"
        > applied </span></strong>for </span>
        <span v-if="agencies.item.interested === statuses.lost"><strong><span
          class="color-yellow"
        > lost </span></strong> </span>{{ agencies.item.grant }}
      </div>
      <div>
        <span v-if="agencies.item.interested === statuses.assigned">
          {{ agencies.item.assigned_by_user_name }}<strong> shared </strong> {{ agencies.item.grant }}
          with {{ agencies.item.agency }}
        </span>
      </div>
    </template>
    <template #cell(date)="dates">
      <div class="color-gray">
        {{ dates.item.date }}
      </div>
    </template>
  </b-table>
</template>

<script>
export default {
  props: {
    grantsInterested: {
      type: Array,
      required: true,
    },
    onRowSelected: {
      type: Function,
      required: true,
    },
    onRowClicked: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      activityFields: [
        {
          // col for the check or X icon
          key: 'icon',
          label: '',
          // thStyle: { width: '1%' },
        },
        {
          // col for the agency is interested or not in grant
          key: 'agencyAndGrant',
          label: '',
          // thStyle: { width: '79%' },
        },
        {
          // col for when the event being displayed happened
          key: 'date',
          label: '',
          // thStyle: { width: '20%' },
        },
      ],
      statuses: {
        rejected: 'Rejected',
        interested: 'Interested',
        assigned: 'Assigned',
        awarded: 'Awarded',
        applied: 'Applied',
        lost: 'Lost',
      },
    };
  },
  computed: {
    activityItems() {
      const rtf = new Intl.RelativeTimeFormat('en', {
        numeric: 'auto',
      });
      const oneDayInMs = 1000 * 60 * 60 * 24;
      return this.grantsInterested.map((grantsInterested) => ({
        agency: grantsInterested.name,
        grant: grantsInterested.title,
        grant_id: grantsInterested.grant_id,
        assigned_by_user_name: grantsInterested.assigned_by_user_name,
        interested: (() => {
          let retVal = null;
          if (grantsInterested.status_code != null) {
            if (grantsInterested.status_code === 'Rejected') {
              retVal = this.statuses.rejected;
            } else if ((grantsInterested.status_code === 'Interested')) {
              retVal = this.statuses.interested;
            } else if ((grantsInterested.status_code === 'Result')) {
              if (grantsInterested.interested_name === 'Award') {
                retVal = this.statuses.awarded;
              } else if (grantsInterested.interested_name === 'Pending') {
                retVal = this.statuses.applied;
              } else if (grantsInterested.interested_name === 'Non-award') {
                retVal = this.statuses.lost;
              }
            }
          } else if (grantsInterested.assigned_by != null) {
            retVal = this.statuses.assigned;
          }
          return retVal;
        })(),
        dateSort: new Date(grantsInterested.created_at),
        date: (() => {
          const timeSince = rtf.format(Math.round((new Date(grantsInterested.created_at).getTime() - new Date().getTime()) / oneDayInMs), 'day');
          const timeSinceInt = parseInt(timeSince, 10);
          if (!Number.isNaN(timeSinceInt) && timeSinceInt > 7) {
            return new Date(grantsInterested.created_at).toLocaleDateString('en-US');
          }
          return timeSince.charAt(0).toUpperCase() + timeSince.slice(1);
        })(),
      }));
    },
  },
};
</script>

<style scoped>
.gutter-icon.row {
  margin-right: -8px;
  margin-left: -8px;
  margin-top: 3px;
}
</style>
