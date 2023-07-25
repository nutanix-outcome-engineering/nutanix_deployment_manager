<script setup>
import { ref, watchEffect } from 'vue'
import Heading from '@/components/Core/Heading.vue'
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  modelValue: Boolean,
  heading: String,
  full: Boolean
})

const emit = defineEmits(['open', 'close', 'closed', 'update:modelValue'])

const isOpen = ref(true)

watchEffect(() => {
  isOpen.value = props.modelValue
})

function close() {
  emit('close')
  isOpen.value = false
  emit('update:modelValue', false)
}

function open() {
  console.log(`Openings`)
  emit('open')
  isOpen.value = true
  emit('update:modelValue', true)
}
</script>
<template>
  <TransitionRoot appear as="template" :show="isOpen">
    <TransitionChild as="template" enter="transform transition ease-in-out duration-500 sm:duration-700"
      enter-from="translate-x-full" enter-to="translate-x-0"
      leave="transform transition ease-in-out duration-500 sm:duration-700" leave-from="translate-x-0"
      leave-to="translate-x-full">
      <div class="h-full w-full border-l border-y rounded-l-md border-gray-200">
        <slot :close="close" />
      </div>
    </TransitionChild>

  </TransitionRoot>
</template>
