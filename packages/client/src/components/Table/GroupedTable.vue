<template>
  <table class="mt-3 table table-striped">
    <thead>
      <tr>
        <th :key="n" v-for="(column, n) in columns">
          {{ columnTitle(column) }}
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(groupRows, key) in groups">
        <tr :key="`${keyPrefix}-${key}`">
          <td :colspan="columns.length">
            {{ titleize(groupBy) }}: <b>{{ key == "undefined" ? "" : key }}</b>
          </td>
        </tr>
        <tr
          :key="`${groupBy}-${key}-${search}-${m}`"
          v-for="(row, m) in groupRows"
        >
          <DataTableColumn
            :key="n"
            v-for="(column, n) in columns"
            :column="column"
            :row="row"
            :lookup="lookup"
          />
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script>
import _ from 'lodash';
import DataTableColumn from '@/components/Table/DataTableColumn.vue';
import { titleize } from '@/helpers/form-helpers';

export default {
  name: 'GroupedTable',
  props: {
    name: String,
    columns: Array,
    rows: Array,
    groupBy: String,
    search: String,
    lookup: Function,
  },
  components: {
    DataTableColumn,
  },
  data() {
    const groups = _.groupBy(this.rows, this.groupBy);
    const keyPrefix = `${this.groupBy}-${this.search}`;
    return {
      groups,
      keyPrefix,
    };
  },
  watch: {
    rows(newRows) {
      this.groups = _.groupBy(newRows, this.groupBy);
    },
    groupBy(newGroupBy) {
      this.groups = _.groupBy(this.rows, newGroupBy);
    },
  },
  methods: {
    columnTitle(column) {
      return column.label ? column.label : titleize(column.name);
    },
    titleize,
  },
};
</script>

<style scoped>
td:first-child {
  position: -webkit-sticky;
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: #e9ecef;
}

th:first-child {
  position: -webkit-sticky;
  position: sticky;
  left: 0;
  z-index: 3;
}

th {
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>
