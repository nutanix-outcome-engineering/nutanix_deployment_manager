<script setup>
import { ref, unref, reactive, computed } from 'vue'
import { ArrowUpTrayIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import Dialog from '@/components/Core/Dialog.vue'
import Button from '@/components/Core/Button.vue'
import IpAddress from '@/components/Core/Form/IpAddress.vue'
import PasswordField from '@/components/Core/Form/PasswordField.vue'
import TextField from '@/components/Core/Form/TextField.vue'

const emit = defineEmits(['ingestByRange'])

const isVisible = ref(false)
const form = ref(formDefault())

function formDefault() {
  return {
    ip: {
      range: {
        start:'',
        stop: ''
      }
    },
    credentials: {
      ipmi: {
        username: '',
        password: ''
      },
      host: {
        username: '',
        password: ''
      }
    }
  }
}

function ingest(by) {
  if (by == 'byRange') {
    let data = {
      ...form.value.ip.range,
      credentials: form.value.credentials
    }
    emit('ingestByRange', data)
  }

  form.value = formDefault()
  isVisible.value = false
}

function credentialDefaults(vendor) {
  switch (vendor) {
    case 'Nutanix':
      form.value.credentials.ipmi = {
          username: 'ADMIN',
          password: 'ADMIN'
        }
      break;
    case 'Dell':
      form.value.credentials.ipmi = {
        username: 'root',
        password: 'calvin'
      }
      break;
  }
}

const canIngestByRange = computed(() => { return Boolean(form.value.ip.range.start && form.value.ip.range.stop) })
</script>

<template>
  <Dialog v-model="isVisible" heading="Ingest Nodes">
    <template #activator="{ open }">
      <Button @click="open" >
        <ArrowUpTrayIcon class="-ml-2 mr-2 w-5 h-5 shrink-0" />
        <span>Import Nodes</span>
      </Button>
    </template>

    <div class="pb-2">
      <div>
        <div class="flex justify-between">
          <span class=" text-lg font-medium leading-6 text-gray-900">Ingest By BMC IP Range</span>
        </div>
        <div class=" grid grid-flow-row grid-cols-2 space-x-2 py-2">
          <IpAddress class="text-gray-900" v-model="form.ip.range.start" placeholder="x.x.x.x" label="Start IP" required/>
          <IpAddress class="text-gray-900" v-model="form.ip.range.stop"  placeholder="x.x.x.x" label="Stop IP"  required/>
        </div>
      </div>
      <div class="pt-2">
        <div class="flex justify-between">
          <span class=" text-base font-medium leading-6 text-gray-900">BMC Credentials</span>
          <Menu as="div" class="relative inline-block">
            <MenuButton>
              <Button kind="secondary" size="sm">Credential Defaults
                <ChevronDownIcon
                  class="ml-2 -mr-1 h-5 w-5"
                  aria-hidden="true"
                />
              </Button>
            </MenuButton>
            <MenuItems class="z-10 absolute right-0 origin-top-right bg-white
                              shadow-lg ring-1 ring-black ring-opacity-5
                              focus:outline-none px-1 divide-y divide-gray-100
                              rounded-md flex flex-col w-full cursor-pointer"
                          >
              <MenuItem as="div" class="group flex w-full text-sm justify-center rounded-md py-0.5 hover:bg-gray-100" v-slot="{ active }">
                <span @click="credentialDefaults('Nutanix')">Nutanix Defaults</span>
              </MenuItem>
              <MenuItem as="div" class="group flex w-full text-sm justify-center rounded-md py-0.5 hover:bg-gray-100" v-slot="{ active }">
                <span @click="credentialDefaults('Dell')">Dell Defaults</span>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
        <div class=" grid grid-flow-row grid-cols-2 space-x-2 py-2">
          <TextField label="Username" v-model="form.credentials.ipmi.username" placeholder="Input Username"/>
          <PasswordField label="Password" v-model="form.credentials.ipmi.password"></PasswordField>
        </div>
      </div>
      <div class="pt-2">
        <div class="flex justify-between">
          <span class=" text-base font-medium leading-6 text-gray-900">Host Credentials</span>
        </div>
        <div class=" grid grid-flow-row grid-cols-2 space-x-2 py-2">
          <TextField label="Username" v-model="form.credentials.host.username" placeholder="Input Username"/>
          <PasswordField label="Password" v-model="form.credentials.host.password"></PasswordField>
        </div>
      </div>
    </div>
      <div class="flex justify-end">
        <Button kind="primary" @click="ingest('byRange')" :disabled="!canIngestByRange">Ingest By Range</Button>
      </div>
  </Dialog>
</template>
