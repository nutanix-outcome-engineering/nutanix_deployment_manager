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
import useSites from '@/composables/useSites.js'

const { sites, getSites } = useSites()

const emit = defineEmits(['handleSubmit'])

const isVisible = ref(false)
const form = ref(hydrateForm())

const props = defineProps({
  rack: {
    type: Object,
    required: false
  }
})

function formDefault() {
  return {
    rack:{
      name: '',
      siteID: undefined,
      row: '',
      column: '',
      datahall: ''
    },
    site: {name: 'Select Site'}
  }
}

function hydrateForm() {
  if(props.rack) {
    return {
      rack:{
        id: props.rack.id,
        name: props.rack.name,
        siteID: props.rack.siteID,
        row: props.rack.row,
        column: props.rack.column,
        datahall: props.rack.datahall
      },
      site: sites.value.filter(site => site.id == props.rack.siteID)[0]
    }
  }
  else {
    return formDefault()
  }
}

watch( isVisible, async () => {
  if(isVisible.value) {
    // await getSites()
    form.value = hydrateForm()
    // if(form.value.rack.siteID) {form.value.site = sites.value.filter(site => site.id == form.value.rack.siteID)[0]}
  }
})

function handleSubmit() {
  form.value.rack.siteID = form.value.site.id
  emit('handleSubmit', unref(form.value.rack))

  form.value = formDefault()
  isVisible.value = false
}
</script>

<template>
  <Dialog v-model="isVisible" :heading="rack ? 'Edit Rack' : 'Add Rack'">
    <template #activator="{ open }">
      <div @click="open">
    <slot>
    <!-- Default Slot content, replaced if there is other content -->
      <Button>
          <ArrowUpTrayIcon class="-ml-2 mr-2 w-5 h-5 shrink-0" />
          <span>Add Rack</span>
      </Button>
    </slot>
    </div>
    </template>

    <div class="">
      <form class="pb-2">
        <div class="flex flex-1 flex-col">
          <span class="pt-2 pb-2 text-sm font-medium leading-6 text-gray-700">Rack Name</span>
          <input type="text" id="name" class=" pt-2 pb-2 text-sm text-gray-700" v-model="form.rack.name" placeholder="myRackName" label="Name" v-on:keydown.enter.prevent/>
            <label for="site" class="pt-2 block text-sm font-medium leading-5 text-gray-700">Site</label>
            <!-- <div>
              <select id="site" v-model="form.site" required class="mt-1 w-full text-sm text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option v-for="site in form.siteList" :key="site.id" :value="site">{{ site.name }}</option>
              </select>
            </div> -->
          <Listbox v-model="form.site" class="relative mt-1 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" as="div">
            <ListboxButton class="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
              <span class="block truncate">{{ form?.site?.name }}</span>
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
              v-for="site in sites"
              :key="site.id"
              :value="site">
                <li :class="[' relative cursor-default select-none py-2 pl-8 pr-4', active ? 'bg-indigo-600 text-white' : 'text-gray-900 ']">
                  <span class="block truncate">{{ site.name }}</span>
                  <span v-if="selected" :class="['absolute inset-y-0 left-0 flex items-center pl-1.5', active ? 'text-white' : 'text-indigo-600']">
                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </Listbox>
          <!-- <span class="pt-2 pb-2 text-sm font-medium leading-6 text-gray-700">Site</span>
          <input type="number" id="name" class=" pt-2 pb-2 text-sm text-gray-700" v-model="form.rack.siteID" placeholder="Site" label="Site" v-on:keydown.enter.prevent/> -->
          <span class="pt-2 pb-2 text-sm font-medium leading-6 text-gray-700">Row</span>
          <input type="text" id="name" class=" pt-2 pb-2 text-sm text-gray-700" v-model="form.rack.row" placeholder="Row" label="Row" v-on:keydown.enter.prevent/>
          <span class="pt-2 pb-2 text-sm font-medium leading-6 text-gray-700">Column</span>
          <input type="text" id="name" class=" pt-2 pb-2 text-sm text-gray-700" v-model="form.rack.column" placeholder="Column" label="Column" v-on:keydown.enter.prevent/>
          <span class="pt-2 pb-2 text-sm font-medium leading-6 text-gray-700">Datahall</span>
          <input type="text" id="name" class=" pt-2 pb-2 text-sm text-gray-700" v-model="form.rack.datahall" placeholder="Datahall" label="Datahall" v-on:keydown.enter.prevent/>
          <div class="pt-2 pb-2 flex justify-end">
            <Button kind="primary" @click="handleSubmit()" >{{rack? 'Edit Rack' : 'Add Rack'}}</Button>
          </div>
        </div>
      </form>
    </div>
  </Dialog>
</template>
