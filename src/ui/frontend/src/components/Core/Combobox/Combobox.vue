<script setup>
import { Combobox, ComboboxOptions, ComboboxOption, ComboboxInput } from '@headlessui/vue'
import { ComboboxButton } from './index.js'
import { CheckIcon, MinusIcon } from '@heroicons/vue/20/solid'
import { ref, computed, provide, watch } from 'vue'
import Fuse from 'fuse.js'

const props = defineProps({
  modelValue: {
    type: [String, Object, Array]
  },

  multiple: {
    type: Boolean
  },

  autocomplete: {
    type: [Boolean, String, Function]
  },

  valueField: {
    type: String,
    default: 'value'
  },

  labelField: {
    type: String,
    default: 'label'
  },

  label: {
    type: String,
  },

  placeholder: {
    type: String,
  }
})

const emit = defineEmits(['update:modelValue'])

const normalizedOptions = ref([])
const filter = ref('')
let fuse

const selected = computed({
  get() {
    if (props.multiple) {
      return normalizedOptions.value.filter(el => props.modelValue.includes(el.value))
    } else {
      return normalizedOptions.value.find(el => el.value === props.modelValue)
    }
  },

  set(val) {
    if (props.multiple) {
      emit('update:modelValue', val.map(el => el.value))
    } else {
      emit('update:modelValue', val.value)
    }
  }
})

watch(normalizedOptions, val => {
  fuse = new Fuse(normalizedOptions.value, {
    keys: [props.labelField],
    threshold: 0.2,
  })
}, { immediate: true })

provide('select', {
  register
})

function register(option) {
  if (option[props.labelField] && option[props.valueField]) {
    option = { label: option[props.labelField], value: option[props.valueField] }
  } else if (typeof option === 'string') {
    option = { label: option, value: option }
  }

  if (normalizedOptions.value.map(el => el[props.valueField]).indexOf(option[props.valueField]) !== -1) {
    return
  }

  normalizedOptions.value = [...normalizedOptions.value, option]
}

const filteredOptions = computed(() => {
  if (!props.autocomplete) {
    return normalizedOptions.value
  }

  if (filter.value === '') {
    return normalizedOptions.value
  }

  return fuse && fuse.search(filter.value).map(result => result.item)
})

const displayValue = computed(() => {
  return selected.value?.label || props.placeholder || 'Select'
})

function handleSelectControl() {
  if (!props.multiple) {
    return
  }

  if (props.modelValue.length === 0 || props.modelValue.length < normalizedOptions.value.length) {
    // debugger
    selected.value = normalizedOptions.value
  } else {
    selected.value = []
  }
}

function onFilterChange(event) {
  filter.value = event.target.value

  /**
   * This is here to resolve a timing issue with the reporting of
   * event.target.value from headlessui. When the ComboboxInput is blurred,
   * they manufacture a fake change event to get the browser to call
   * this function for us. Something about that creates a weird
   * issue where if you read the target value (which should be "" after a blur),
   * you get the value just before headlessui cleared it.
   */
  setTimeout(() => {
    filter.value = event.target.value
  }, 500)
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-2 flex justify-between items-end leading-5 text-charcoal-800 dark:text-charcoal-200">{{ label }}</label>

    <Combobox static :multiple="multiple" v-model="selected" v-slot="{ open }">
      <div class="relative inline-flex w-full">
        <slot v-if="!autocomplete" name="button">
          <ComboboxButton chevron>{{ displayValue }}</ComboboxButton>
        </slot>

        <template v-if="autocomplete">
          <ComboboxButton chevron>
            <button class="flex items-center space-x-2" @click.stop.prevent="handleSelectControl" v-if="multiple">
              <div
                class="flex items-center justify-center w-4 h-4 rounded border dark:border-charcoal-700 dark:bg-charcoal-700"
                :class="{
                  'border-charcoal-300 text-charcoal-500 dark:text-charcoal-100': props.modelValue.length < normalizedOptions.length,
                  'border-iris-500 bg-iris-500 dark:bg-iris-500 dark:border-iris-500 text-white': props.modelValue.length === normalizedOptions.length,
                }"
              >
                <!-- Maybe need to use outline icons -->
                <MinusIcon v-if="props.modelValue.length !== 0 && props.modelValue.length < normalizedOptions.length" class="w-3 h-3"/>
                <CheckIcon v-else class="w-3 h-3"/>

              </div>
              <span class="whitespace-nowrap font-semibold text-sm text-charcoal-500 dark:text-charcoal-300">
                <template v-if="props.modelValue.length === 0">Select All</template>
                <template v-else>{{ props.modelValue.length }} selected</template>
              </span>
            </button>
            <ComboboxInput
              class="flex-1 p-0 bg-charcoal-100 dark:bg-charcoal-800 text-sm font-semibold group-active:bg-charcoal-300 group-hover:bg-charcoal-200 dark:group-hover:bg-charcoal-800 border-none text-charcoal-800 dark:text-charcoal-200 focus:ring-0"
              :display-value="selected => selected.label"
              placeholder="Search ..."
              @change="onFilterChange"
              @focus="$event.target.select()"
            />
          </ComboboxButton>
        </template>




        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <ComboboxOptions v-show="open" static class="absolute right-0 top-10 z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-charcoal-700 py-1 px-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            <!--
              This slot is only here to allow <Option/> components to be mounted (so that they are
              registered with the Combobox). <Option/> components are renderless and do not produce
              DOM nodes.
            -->
            <slot />

            <ComboboxOption v-for="option in filteredOptions" as="template" v-slot="{ active, selected }" :value="option">
              <li :class="[active ? 'bg-iris-100 text-iris-900 dark:bg-iris-600 dark:text-iris-100' : 'text-charcoal-900 dark:text-charcoal-100', 'relative cursor-pointer select-none py-2 pl-10 pr-4 rounded']">
                <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                  {{ typeof option === 'string' ? option : option.label }}
                </span>

                <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-iris-600 dark:text-iris-200" >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </transition>
      </div>
    </Combobox>
  </div>
</template>
