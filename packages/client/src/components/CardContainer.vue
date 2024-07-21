<template>
  <div class="default">
    <b-card
      :title="title"
      class="card"
    >
      <slot />
    </b-card>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: false,
      default: '',
    },
  },
};
</script>

<style>
.default {
    background-color:white;
    border: 1px solid lightgray;
    border-radius: 8px;
    padding:15px;
    margin:10px;
}
.card {
    border: 0px solid;
    padding: 0px;
}
.card-body {
  padding: 0px;
}
</style>
