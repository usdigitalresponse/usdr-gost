<template>
  <b-table
    hover
    :items="closestGrants"
    :fields="upcomingFields"
    sort-by="close_date"
    class="table table-borderless"
    thead-class="d-none"
    selectable
    select-mode="single"
    @row-selected="onRowSelected"
    @row-clicked="onRowClicked"
  >
    <template #cell(title)="data">
      <div>{{ data.value }}</div>
      <div class="color-gray">
        {{ data.item.interested_agencies.join(', ') }}
      </div>
    </template>
    <template #cell(close_date)="data">
      <div :class="styleDate(data.value)">
        {{ formatDate(data.value) }}
      </div>
    </template>
  </b-table>
</template>

<script>
import { daysUntil } from '@/helpers/dates';
import { defaultCloseDateThresholds } from '@/helpers/constants';

export default {
  props: {
    closestGrants: {
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
    dangerThreshold: {
      type: Number,
      default: defaultCloseDateThresholds.danger,
    },
    warningThreshold: {
      type: Number,
      default: defaultCloseDateThresholds.warning,
    },
  },
  data() {
    return {
      upcomingFields: [
        {
          // col for Grants and interested agencies
          key: 'title',
          label: '',
          thStyle: { width: '80%' },
        },
        {
          // col for when the grant will be closing
          key: 'close_date',
          label: '',
          thStyle: { width: '20%' },
        },
      ],
    };
  },
  methods: {
    styleDate(value) {
      // value is an ISO string representing close date of grant
      const daysUntilClose = daysUntil(value);
      if (daysUntilClose <= this.dangerThreshold) {
        return 'dangerDate';
      }
      if (daysUntilClose <= this.warningThreshold) {
        return 'warnDate';
      }
      return 'normalDate';
    },
    formatDate(value) {
      // value is an ISO string representing the close date of grant
      // needs to be treated as local date
      return new Date(value).toLocaleDateString('en-US', { timeZone: 'UTC' });
    },
  },
};
</script>

<style scoped>
.dangerDate {
  color: #C22E31;
  font-weight: bold;
}
.warnDate {
  color: #956F0D;
  font-weight: bold;
}
.normalDate {
  color: black;
}
</style>
