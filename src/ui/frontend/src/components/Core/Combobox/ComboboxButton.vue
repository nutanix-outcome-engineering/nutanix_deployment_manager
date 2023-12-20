<template>
  <ComboboxButton
    :class="[
      'w-full group flex items-center gap-2 bg-charcoal-100 dark:bg-charcoal-800 py-2 px-3 rounded text-sm font-semibold ',
      disabled
        ? 'cursor-not-allowed text-charcoal-400 dark:text-charcoal-500'
        : 'cursor-pointer active:bg-charcoal-300 hover:bg-charcoal-200 text-charcoal-800 dark:text-charcoal-200',
    ]"
    v-slot="{ open, value }"
  >
    <!-- <Icon
      v-if="icon"
      :name="icon"
      outline
      class="mr-2 w-4 h-4 text-charcoal-600 dark:text-charcoal-400"
      aria-hidden="true"
    /> -->
    <div class="truncate flex flex-1 items-center gap-4">
      <slot :value="value" />
    </div>
    <ChevronUpIcon v-if="chevron && open"
      class="ml-2 w-4 h-4 text-charcoal-600 dark:text-charcoal-400"
      aria-hidden="true"
    />
    <ChevronDownIcon v-else-if="chevron"
      class="ml-2 w-4 h-4 text-charcoal-600 dark:text-charcoal-400"
      aria-hidden="true"
    />
  </ComboboxButton>
</template>

<script setup>
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/20/solid'
import { ComboboxButton } from '@headlessui/vue'

const props = defineProps({
  icon: String,
  chevron: Boolean,
  disabled: Boolean
})
</script>
