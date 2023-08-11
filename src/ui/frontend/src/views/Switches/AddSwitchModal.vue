<script setup>
import { ref, unref, watch, computed } from 'vue'
import {
  Listbox,
  ListboxLabel,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'
import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import Dialog from '@/components/Core/Dialog.vue'
import Button from '@/components/Core/Button.vue'
import TextList from '@/components/Core/Form/TextList.vue'
import useRacks from '@/composables/useRacks.js'

const { racks, getRacks } = useRacks()

const emit = defineEmits(['handleSubmit'])

const isVisible = ref(false)
const form = ref(hydrateForm())

const props = defineProps({
  sw: {
    type: Object,
    required: false
  }
})

function formDefault() {
  return {
    sw:{
      type: '',
      rackID: undefined,
      ip: '',
      name: '',
      rackUnit: ''
    },
    rack: {name: 'Select Rack'}
  }
}

function hydrateForm() {
  if(props.sw) {
    return {
      sw:{
        id: props.sw.id,
        type: props.sw.type,
        rackID: props.sw.rackID,
        ip: props.sw.ip,
        name: props.sw.name,
        rackUnit: props.sw.rackUnit
      },
      rack: racks.value.filter(rack => rack.id == props.sw.rackID)[0]
    }
  }
  else {
    return formDefault()
  }
}

watch( isVisible, async () => {
  if(isVisible.value) {
    form.value = hydrateForm()
  }
})

function handleSubmit() {
  form.value.sw.rackID = form.value.rack.id
  emit('handleSubmit', unref(form.value.sw))

  form.value = formDefault()
  isVisible.value = false
}
</script>

<template>
  <Dialog v-model="isVisible" :heading="sw ? 'Edit Switch' : 'Add Switch'">
    <template #activator="{ open }">
      <div @click="open">
    <slot>
    <!-- Default Slot content, replaced if there is other content -->
      <Button>
          <ArrowUpTrayIcon class="-ml-2 mr-2 w-5 h-5 shrink-0" />
          <span>Add Switch</span>
      </Button>
    </slot>
    </div>
    </template>

    <div class="">
      <form class="pb-2">
        <div class="flex flex-1 flex-col">
          <label for="type" class="pt-2 block text-sm font-medium leading-5 text-gray-700">Type</label>
          <select id="type" v-model="form.sw.type" required class="pt-2 pb-2 w-full text-sm text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option value="tor">Top of Rack</option>
                <option value="ipmi">OOB Management (IPMI)</option>
              </select>
          <span class="pt-2 pb-2 text-sm font-medium leading-6 text-gray-700">Switch Name</span>
          <input type="text" id="name" class=" pt-2 pb-2 text-sm text-gray-700" v-model="form.sw.name" placeholder="mySwitchName" label="Name" v-on:keydown.enter.prevent/>
            <label for="rack" class="pt-2 block text-sm font-medium leading-5 text-gray-700">Rack</label>
          <Listbox v-model="form.rack" class="relative mt-1 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" as="div">
            <ListboxButton class="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
              <span class="block truncate">{{ form?.rack?.name }}</span>
              <span
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
              >
                <ChevronUpDownIcon
                class="h-5 w-5 text-gray-400"
                aria-hidden="true"
                />
            </span>
            </ListboxButton>
            <ListboxOptions class="absolute divide-y divide-gray-300 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <ListboxOption
              v-slot="{active,selected}"
              v-for="rack in racks"
              :key="rack.id"
              :value="rack">
                <li :class="[' relative cursor-default select-none py-2 pl-8 pr-4', active ? 'bg-indigo-600 text-white' : 'text-gray-900 ']">
                  <span class="block truncate">{{ rack.name }}</span>
                  <span v-if="selected" :class="['absolute inset-y-0 left-0 flex items-center pl-1.5', active ? 'text-white' : 'text-indigo-600']">
                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </Listbox>
          <span class="pt-2 pb-2 text-sm font-medium leading-6 text-gray-700">IP Address</span>
          <input type="text" id="ip" class=" pt-2 pb-2 text-sm text-gray-700" v-model="form.sw.ip" placeholder="10.x.y.z" label="ip" v-on:keydown.enter.prevent/>
          <span class="pt-2 pb-2 text-sm font-medium leading-6 text-gray-700">Rack Unit Location</span>
          <input type="number" id="rackUnit" class=" pt-2 pb-2 text-sm text-gray-700" v-model="form.sw.rackUnit" placeholder="52" label="rackUnit" v-on:keydown.enter.prevent/>
          <div class="pt-2 pb-2 flex justify-end">
            <Button kind="primary" @click="handleSubmit()" >{{sw? 'Edit Switch' : 'Add Switch'}}</Button>
          </div>
        </div>
      </form>
    </div>
  </Dialog>
</template>
