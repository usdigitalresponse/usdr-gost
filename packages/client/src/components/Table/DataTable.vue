<template>
  <div>
    <div class="mt-3 row">
      <div class="col-3">
        <div v-if="hasViews">
          <select class="form-control" v-model="viewName" @change="changeView">
            <option>Standard View</option>
            <option :key="view.name" v-for="view in views">{{
              view.name
            }}</option>
          </select>
        </div>
      </div>
      <div :class="hasViews ? 'col-9' : 'col-12'">
        <input
          class="form-control"
          @input="onSearchChange"
          placeholder="Search..."
        />
      </div>
    </div>
    <div class="row">
      <div class="col-12" v-if="groupBy">
        <GroupedTable
          :name="name"
          :columns="columns"
          :rows="filteredRows()"
          :groupBy="groupBy"
          :search="search"
          :lookup="lookup"
        />
      </div>
      <div class="col-12" v-else>
        <BasicTable
          :name="name"
          :columns="columns"
          :rows="filteredRows()"
          :lookup="lookup"
        />
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import BasicTable from '@/components/Table/BasicTable.vue';
import GroupedTable from '@/components/Table/GroupedTable.vue';
import { titleize, singular } from '@/helpers/form-helpers';

const component = {
  name: 'DataTable',
  components: {
    BasicTable,
    GroupedTable,
  },
  props: {
    table: Object,
    rows: Array,
    user: Object,
  },
  data() {
    const name = this.table ? this.table.name : '';
    const viewName = 'Standard View';
    const groupBy = null;
    const createNewLabel = `Create New ${titleize(singular(name))}`;
    return {
      name,
      createUrl: `/create/${name}`,
      search: '',
      createNewLabel,
      viewName,
      groupBy,
    };
  },
  computed: {
    columns() {
      if (!this.table) {
        return [];
      }
      const view = _.find(this.table.views, (v) => v.name === this.viewName);
      if (!view || !view.columns) {
        return this.table.columns;
      }
      return view.columns.map((n) => _.find(this.table.columns, (c) => c.name === n));
    },
    views() {
      return _.get(this.table, 'views', []);
    },
    hasViews() {
      return this.views && this.views.length > 0;
    },
  },
  watch: {
    table(table) {
      this.createUrl = `/create/${table.name}`;
      this.createNewLabel = `Create New ${titleize(singular(table.name))}`;
      this.viewName = 'Standard View';
      this.groupBy = null;
    },
  },
  methods: {
    columnTitle(column) {
      return column.label ? column.label : titleize(column.name);
    },
    titleize,
    getGroupBy(viewName) {
      const view = _.find(this.table.views, (v) => v.name === viewName);
      return view ? view.groupBy : null;
    },
    onSearchChange(e) {
      e.preventDefault();
      this.search = e.target.value;
    },
    filteredRows() {
      if (!this.search) {
        return this.rows;
      }
      const search = this.search.toLowerCase();
      const result = this.rows.filter((row) => {
        const match = _.some(this.columns, (column) => {
          const value = `${row[column.name]}`;
          return value.toLowerCase().indexOf(search) >= 0;
        });
        return match;
      });
      return result;
    },
    documentUrl(row) {
      return `/documents/${this.table.name}/${row.id}`;
    },
    lookup(column, row) {
      const id = parseInt(row[column.name], 10);
      const related = this.$store.getters.documentByTypeAndId(
        column.foreignKey.table,
        id,
      );
      if (related) {
        return `${related.content[column.foreignKey.show]}`;
      }
      return row[column.name];
    },
    lookupLink(column, row) {
      return `/documents/${column.foreignKey.table}/${row[column.name]}`;
    },
    changeView(e) {
      e.preventDefault();
      const viewName = e.target.value;
      this.viewName = viewName;
      this.groupBy = this.getGroupBy(viewName);
    },
  },
};

export default component;
</script>
