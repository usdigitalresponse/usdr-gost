<template>
<section class="container-fluid">
    <b-row>
        <b-col><h3>Keywords</h3></b-col>
        <b-col class="d-flex justify-content-end">
            <div>
                <b-button variant="success" name="include-button" @click="openAddKeywordModal">Add</b-button>
            </div>
        </b-col>
    </b-row>
    <b-table sticky-header="600px" hover :items="keywords" :fields="fields">
        <template #cell(actions)="row">
            <b-button variant="danger" class="mr-1" size="sm" @click="deleteKeyword(row.item.id)">
            <b-icon icon="trash-fill" aria-hidden="true"></b-icon>
            </b-button>
        </template>
    </b-table>
    <hr>
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
          thStyle: { width: '92%' },
        },
        {
          key: 'type',
          thStyle: { width: '3%' },
        },
        {
          key: 'actions',
          label: '',
          thStyle: { width: '5%' },
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
      keywords: 'keywords/allKeywords',
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
