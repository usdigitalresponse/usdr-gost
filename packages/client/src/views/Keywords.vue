<template>
<section class="container-fluid">
    <b-row>
        <b-col><h3>Include results with:</h3></b-col>
        <b-col class="d-flex justify-content-end">
            <div>
                <b-button variant="success" @click="openAddKeywordModal">Add</b-button>
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
    <b-row>
        <b-col><h3>Exclude results with:</h3></b-col>
        <b-col class="d-flex justify-content-end">
            <div>
                <b-button variant="success" @click="openAddKeywordModal">Add</b-button>
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
    <AddKeywordModal :showModal.sync="showAddKeywordModal"/>
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
        },
        {
          key: 'notes',
        },
        { key: 'actions', label: 'Actions' },
      ],
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
    openAddKeywordModal() {
      this.showAddKeywordModal = true;
    },
  },
};
</script>
