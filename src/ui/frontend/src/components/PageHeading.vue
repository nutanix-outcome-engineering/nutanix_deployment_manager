<template>
  <div class="md:flex md:items-center md:justify-between">
    <div class="flex-1 min-w-0">
      <h2 class="text-xl font-medium leading-7 text-gray-900 sm:text-3xl sm:leading-9 sm:truncate">
        {{ title }}
      </h2>
    </div>
    <div class="mt-4 flex md:mt-0 md:ml-4">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHeading',

  props: {
    title: {
      type: String
    }
  }
}
</script>
