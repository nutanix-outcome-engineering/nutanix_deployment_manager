<template>
  <a :href="href" target="_blank" rel="noreferrer" class="text-blue-600 hover:underline">
    <slot></slot>
  </a>
</template>

<script>
export default {
  name: 'ExternalLink',
  props: ['href']
}
</script>
