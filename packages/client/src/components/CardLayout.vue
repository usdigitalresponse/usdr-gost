<template>
  <layout>
    <div class="background">
      <slot></slot>
    </div>
  </layout>
</template>

<style>
.background {
  position: fixed;
  z-index: -1000;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgb(235, 235, 235);
}
</style>
