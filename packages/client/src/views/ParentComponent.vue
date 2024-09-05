<template>
  <div>
    <!-- <v-select
      v-model="selectedItem"
      :options="options"
      name="selection"
      class="flex-grow-1 mr-3"
      label="name"
      track-by="id"
      :clearable="false"
    /> -->
    <child-component data-child-el />
  </div>
</template>

<script>
// import vSelect from 'vue-select';
import ChildComponent from '@/views/ChildComponent.vue';

export default {
  components: { ChildComponent },
  data() {
    return {
      selectedItem: null,
      options: [
        { label: 'Option 1', id: 1 },
        { label: 'Option 2', id: 2 },
        { label: 'Option 3', id: 3 },
      ],
    };
  },
};
</script>
