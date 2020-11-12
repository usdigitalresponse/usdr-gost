<template>
  <td :style="style(column)">
    <span v-if="column.primaryKey">
      <router-link :to="documentUrl(row)">{{ row[column.name] }}</router-link>
    </span>
    <span v-else-if="column.foreignKey">
      <router-link :to="lookupLink(column, row)">{{
        lookupValue(column, row)
      }}</router-link>
    </span>
    <span v-else-if="column.format">
      {{ format(row[column.name], column.format) }}
    </span>
    <span v-else-if="column.component">
      <component :is="column.component" :row="row" />
    </span>
    <span v-else>
      {{ row[column.name] }}
    </span>
  </td>
</template>

<script>
import numeral from 'numeral';
import _ from 'lodash';

export default {
  name: 'DataTableColumn',
  props: {
    name: String,
    column: Object,
    row: Object,
    lookup: Function,
  },
  methods: {
    lookupValue(column, row) {
      if (_.isFunction(this.lookup)) {
        return this.lookup(column, row);
      }
      return row[column.name];
    },
    lookupLink(column, row) {
      return `/#/documents/${column.foreignKey.table}/${row[column.name]}`;
    },
    format(value, fmt) {
      return numeral(value).format(fmt);
    },
    documentUrl(row) {
      return `/documents/${this.name}/${row.id}`;
    },
    style(column) {
      if (column && column.format) {
        return 'text-align: right';
      }
      return '';
    },
  },
};
</script>
