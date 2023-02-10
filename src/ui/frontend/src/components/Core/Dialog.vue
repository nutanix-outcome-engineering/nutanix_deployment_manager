<script setup>
import { ref, watchEffect } from 'vue'
import Heading from '@/components/Core/Heading.vue'
import { TransitionRoot, TransitionChild, Dialog, DialogOverlay, DialogTitle } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  modelValue: Boolean,
  heading: String,
  full: Boolean,
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
  emit('open')
  isOpen.value = true
  emit('update:modelValue', true)
}
</script>

<template>
  <slot name="activator" v-if="$slots.activator" :open="open" />

  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="close">
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="min-h-screen px-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay class="fixed inset-0 bg-black/20" />
          </TransitionChild>

          <span class="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
            @beforeEnter="$emit('closed')"
            @afterLeave="$emit('closed')"
          >
            <div
              :class="[
                'inline-flex flex-col',
                'max-h-[70vh] h-full w-full overflow-hidden',
                'p-6',
                'align-bottom mb-14 sm:align-middle sm:w-auto sm:max-w-md md:max-w-[70%] 2xl:max-w-6xl',
                'transition-all transform bg-white border shadow-xl rounded-lg'
              ]"
            >
              <div v-if="heading" class="flex items-center justify-between pb-3">
                <div>
                  <Heading :level="2" v-if="heading">{{ heading }}</Heading>
                </div>
                <button @click="close">
                  <XMarkIcon class="w-5 h-5 shrink-0" />
                </button>
              </div>
              <div class="flex-1 flex flex-col text-left">
                <slot :close="close" />
              </div>
              <div v-if="$slots.toolbar" class="flex justify-end pt-6 mt-3">
                <slot name="toolbar" :close="close" />
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
