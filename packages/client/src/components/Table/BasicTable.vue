<template>
  <table class="mt-3 table table-striped">
    <thead class="thead-light">
      <tr>
        <th :key="`th|${n}`" v-for="(column, n) in columns">
          {{ columnTitle(column) }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr :key="`row|${r}`" v-for="(row, r) in rows">
        <DataTableColumn
          :key="`c|${name}|${n}`"
          v-for="(column, n) in columns"
          :column="column"
          :row="row"
          :lookup="lookup"
        />
      </tr>
    </tbody>
  </table>
</template>

<script>
import DataTableColumn from '@/components/Table/DataTableColumn.vue';
import { titleize } from '@/helpers/form-helpers';

export default {
  name: 'BasicTable',
  props: {
    name: String,
    columns: Array,
    rows: Array,
    lookup: Function,
  },
  components: {
    DataTableColumn,
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
