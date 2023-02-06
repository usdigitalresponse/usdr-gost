<template>
<section class="container-fluid">
    <b-row>
        <b-col><h3>Include results with:</h3></b-col>
        <b-col class="d-flex justify-content-end">
            <div>
                <b-button variant="success" name="include-button" @click="openAddKeywordModal">Add</b-button>
            </div>
        </b-col>
    </b-row>
    <b-table sticky-header="600px" hover :items="includeKeywords" :fields="fields">
        <template #cell(actions)="row">
            <b-button variant="danger" class="mr-1" size="sm" @click="deleteKeyword(row.item.id)">
            <b-icon icon="trash-fill" aria-hidden="true"></b-icon>
            </b-button>
        </template>
    </b-table>
    <hr>
    <b-row>
        <b-col><h3>Exclude results with:</h3></b-col>
        <b-col class="d-flex justify-content-end">
            <div>
                <b-button variant="success" name="exclude-button" @click="openAddKeywordModal">Add</b-button>
            </div>
        </b-col>
    </b-row>
    <b-table sticky-header="600px" hover :items="excludeKeywords" :fields="fields">
        <template #cell(actions)="row">
            <b-button variant="danger" class="mr-1" size="sm" @click="deleteKeyword(row.item.id)">
            <b-icon icon="trash-fill" aria-hidden="true"></b-icon>
            </b-button>
        </template>
    </b-table>
    <AddKeywordModal :keywordType="keywordType" :showModal.sync="showAddKeywordModal"/>
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

import AddKeywordModal from '@/components/Modals/AddKeyword.vue';

export default {
  components: {
    AddKeywordModal,
  },
  data() {
    return {
      fields: [
        {
          key: 'search_term',
          thStyle: { width: '20%' },
        },
        {
          key: 'notes',
          thStyle: { width: '50%' },
        },
        {
          key: 'created_at',
          thStyle: { width: '20%' },
          formatter: (value) => {
            const date = new Date(value);
            const month = date.getMonth();
            const day = date.getMonth();
            const year = date.getFullYear();

            return `${month}/${day}/${year}`;
          },
        },
        {
          key: 'actions',
          label: 'Actions',
          thStyle: { width: '10%' },
        },
      ],
      keywordType: 'include',
      showAddKeywordModal: false,
    };
  },
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      includeKeywords: 'keywords/includeKeywords',
      excludeKeywords: 'keywords/excludeKeywords',
      userRole: 'users/userRole',
      selectedAgency: 'users/selectedAgency',
    }),
  },
  watch: {
    selectedAgency() {
      this.setup();
    },
  },
  methods: {
    ...mapActions({
      fetchKeywords: 'keywords/fetchKeywords',
      deleteKeyword: 'keywords/deleteKeyword',
    }),
    setup() {
      this.fetchKeywords();
    },
    openAddKeywordModal(event) {
      const { name } = event.target;
      this.keywordType = name.slice(0, name.indexOf('-'));
      this.showAddKeywordModal = true;
    },
  },
};
</script>
