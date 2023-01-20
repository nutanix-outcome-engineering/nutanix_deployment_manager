<script setup>
import { RouterLink, RouterView } from 'vue-router'
import Application from './layouts/Application.vue';
</script>

<template>
<component :is="Application">
  <!-- <router-view /> -->
</component>
</template>
