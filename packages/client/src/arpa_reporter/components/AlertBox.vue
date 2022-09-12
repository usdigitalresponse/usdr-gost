<template>
  <div class="alert alert-dismissable col-md-6" v-bind:class="classes" role="alert">
    {{ text }}

    <button type="button" class="close" aria-label="Close" v-on:click="$emit('dismiss')">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'AlertBox',
  props: {
    text: String,
    level: String
  },
  computed: {
    classes: function () {
      const level = ['ok', 'warn', 'err'].indexOf(this.level) === -1 ? 'primary' : this.level
      return {
        'alert-primary': level === 'primary',
        'alert-success': level === 'ok',
        'alert-warning': level === 'warn',
        'alert-danger': level === 'err'
      }
    }
  }
}
</script>

<!-- NOTE: This file was copied from src/components/AlertBox.vue (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z -->
