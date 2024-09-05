<template>
  <div>
    Child!
  </div>
</template>

<script>

export default {
  components: {},
  data() {
    return {
      internalValue: 'Wine!',
    };
  },
  async beforeMount() {
    console.log('Child before mount');
  },
};
</script>
