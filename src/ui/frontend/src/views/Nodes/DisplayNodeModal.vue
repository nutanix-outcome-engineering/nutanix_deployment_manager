<script setup>
import { ref, unref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import { XMarkIcon } from '@heroicons/vue/24/solid'
import Dialog from '@/components/Core/Dialog.vue'
import Button from '@/components/Core/Button.vue'

const isVisible = ref(false)
const editing = ref(false)
const route = useRoute()
const form = ref({})

const isIngestingNode = computed(() => route.name.toLowerCase().includes('ingest'))

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

form.value = {
  ...props.node
}

function edit() {
  editing.value = !editing.value
}
</script>

<template>
  <Dialog v-model="isVisible">
    <template #activator="{ open }">
      <div @click="open">
        <slot></slot>
      </div>
    </template>

<!-- <template #toolbar>
  <button @click="isVisible = false">
    <XMarkIcon class="w-5 h-5 shrink-0" />
  </button>
</template> -->

    <div class="overflow-hidden bg-white shadow sm:rounded-lg">
      <div class="flex items-center justify-between px-2 py-5 sm:px-2">
        <div class="relative">
          <h3 class="text-lg font-medium leading-6 text-gray-900">{{ isIngestingNode ? 'Ingesting ': '' }}Node Information</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Details about the {{ isIngestingNode ? 'ingesting ': '' }}node.</p>
        </div>
        <button @click="edit">
          Edit
        </button>
        <button @click="isVisible = false">
          <XMarkIcon class="w-5 h-5 shrink-0" />
        </button>
      </div>
      <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
        <div class="sm:divide-y sm:divide-gray-200">
          <div class="py-4 sm:py-5 sm:px-4">
            <p class="max-w-2xl text-sm font-medium mb-1 text-gray-500 pb-1 ">Details about the IPMI</p>
            <div class="px-2 grid grid-cols-8 gap-x-6 gap-y-8 sm:grid-col-2">
              <div class="sm:col-span-2">
                <label  for="ipmiIP" class="pb-0 text-sm font-normal text-gray-500">IPMI IP</label>
                  <input type="text" id="ipmiIP" v-model="form.ipmi.ip" :disabled="!editing" placeholder="10.1.1.1"
                    class="relative -left-3 mt-2 text-sm text-gray-900 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                  />
              </div>
              <div class="sm:col-span-2">
                <label for="ipmiHostname" class="pb-1 text-sm font-normal text-gray-500">IPMI Hostname</label>
                <input type="text" id="ipmiHostname" v-model="form.ipmi.hostname" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="ipmiSubnet" class="pb-1 text-sm font-normal text-gray-500">IPMI Subnet</label>
                <input type="text" id="ipmiSubnet" v-model="form.ipmi.subnet" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="ipmiGateway" class="pb-1 text-sm font-normal text-gray-500">IPMI Gateway</label>
                <input type="text" id="ipmiGateway" v-model="form.ipmi.gateway" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                />
              </div>
            </div>
          </div>
          <div class="py-4 sm:py-5 sm:px-4">
            <p class="max-w-2xl text-sm font-medium mb-1 text-gray-500 pb-1 ">Details about the Host</p>
            <div class="px-2 grid grid-cols-8 gap-x-6 gap-y-8 sm:grid-col-2">
              <div class="sm:col-span-2">
                <label  for="hostIP" class="pb-0 text-sm font-normal text-gray-500">Host IP</label>
                  <input type="text" id="hostIP" v-model="form.host.ip" :disabled="!editing" placeholder="10.1.1.1"
                    class="relative -left-3 mt-2 text-sm text-gray-900 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                  />
              </div>
              <div class="sm:col-span-2">
                <label for="hostHostname" class="pb-1 text-sm font-normal text-gray-500">Host Hostname</label>
                <input type="text" id="hostHostname" v-model="form.hostHostname" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="hostSubnet" class="pb-1 text-sm font-normal text-gray-500">Host Subnet</label>
                <input type="text" id="hostSubnet" v-model="form.host.subnet" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="hostGateway" class="pb-1 text-sm font-normal text-gray-500">Host Gateway</label>
                <input type="text" id="hostGateway" v-model="form.host.gateway" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                />
              </div>
            </div>
          </div>
          <div class="py-4 sm:py-5 sm:px-4">
            <p class="max-w-2xl text-sm font-medium mb-1 text-gray-500 pb-1 ">Details about the Host</p>
            <div class="px-2 grid grid-cols-8 gap-x-6 gap-y-8 sm:grid-col-2">
              <div class="sm:col-span-2">
                <label  for="cvmIP" class="pb-0 text-sm font-normal text-gray-500">CVM IP</label>
                  <input type="text" id="cvmIP" v-model="form.cvm.ip" :disabled="!editing" placeholder="10.1.1.1"
                    class="relative -left-3 mt-2 text-sm text-gray-900 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                  />
              </div>
              <div class="sm:col-span-2">
                <label for="cvmHostname" class="pb-1 text-sm font-normal text-gray-500">CVM Hostname</label>
                <input type="text" id="cvmHostname" v-model="form.cvm.hostname" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="cvmSubnet" class="pb-1 text-sm font-normal text-gray-500">CVM Subnet</label>
                <input type="text" id="cvmSubnet" v-model="form.cvm.subnet" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="cvmGateway" class="pb-1 text-sm font-normal text-gray-500">CVM Gateway</label>
                <input type="text" id="cvmGateway" v-model="form.cvm.gateway" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]"
                />
              </div>
            </div>
          </div>
          <div v-if="isIngestingNode" class="py-4 sm:grid sm:grid-cols-8 sm:gap-4 sm:py-5 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Failure Reason</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:col-span-7 sm:mt-0">{{ form.failureReason || "No failures"}}</dd>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>
