<template>
  <div>
    <b-button v-b-toggle.saved-search-panel variant="outline-secondary">
      My Saved Searches
    </b-button>
    <b-sidebar
      id="saved-search-panel"
      class="saved-search-panel"
      right
      shadow
    >
    <template #header="{ hide }">
      <div class="saved-search-title">Saved Searches</div>
      <b-button type="button" class="close" aria-label="Close" @click="hide">
       <span aria-hidden="true">&times;</span>
      </b-button>
    </template>
    <div class="saved-search-empty-state">
      <h4>No saved searches</h4>
      <span>Save search criteria to easily apply or share a search</span>
    </div>
    <template #footer="{ hide }">
     <div class="d-flex text-light align-items-center px-3 py-2">
      <b-button size="sm" @click="hide" variant="outline-primary" class="borderless-button">Close</b-button>
     </div>
    </template>
    </b-sidebar>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { VBToggle } from 'bootstrap-vue';

export default {
  props: {
    showModal: Boolean,
  },
  directives: {
    'v-b-toggle': VBToggle,
  },
  data() {
    return {};
  },
  validations: {},
  watch: {},
  computed: {
    ...mapGetters({}),
  },
  mounted() {
  },
  methods: {
    ...mapActions({}),
  },
};
</script>
<style>
.saved-search-title{
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 120%;
}
.b-sidebar.b-sidebar-right > .b-sidebar-header .close{
  margin-right: 0px;
}
.b-sidebar-header{
  justify-content: space-between;
  border-bottom: solid #DAE0E5;
}
.b-sidebar-body{
  display: flex;
}
.b-sidebar-footer{
  display: flex;
  justify-content: end;
  border-top: solid #DAE0E5;
}
.saved-search-empty-state{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-style: normal;
}
.saved-search-empty-state > h4{
  font-weight: 700;
  font-size: 16px;
  line-height: 120%;
}
.saved-search-empty-state > span{
  font-weight: 500;
  font-size: 14px;
  line-height: 150%;
}
</style>
