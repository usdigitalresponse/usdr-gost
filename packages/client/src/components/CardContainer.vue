<template>
  <v-card
    :title="title"
  >
    <div class="default">
        <slot></slot>
    </div>  
  </v-card>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: false,
    },
  },
};
</script>

<style>
.default {
    background-color:white;
    border: 1px solid lightgray;
    padding: 15px;
    border-radius: 8px;
}
</style>
