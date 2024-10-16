<template>
  <div
    class="text-truncate"
    :title="title"
  >
    <span class="font-weight-bold">{{ name }}</span>
    <span class="bullet mx-1">&bull;</span>
    <span class="team">{{ team }}</span>
  </div>
</template>

<script>
export default {
  props: {
    name: {
      type: String,
      required: true,
    },
    team: {
      type: String,
      required: true,
    },
  },
  computed: {
    title() {
      return `${this.name} \u2022 ${this.team}`;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/scss/colors-base-tokens.scss';

.team {
  color: $raw-gray-500;
  font-weight: 400;
  font-size: 0.75rem;
}

.bullet {
  color: $raw-gray-600;
  font-size: 0.75rem;
}
</style>
