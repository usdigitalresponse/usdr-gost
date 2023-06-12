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
      <div @click="hide">
        <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="x" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi-x b-icon bi header-close-button"><g><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"></path></g></svg>
      </div>
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
.header-close-button{
  cursor: pointer;
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
