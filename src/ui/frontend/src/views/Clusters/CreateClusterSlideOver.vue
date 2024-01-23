<script setup>
import { ref, computed, defineEmits } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from '@headlessui/vue'
import { Combobox, Option } from '@/components/Core/Combobox'
import Button from '@/components/Core/Button.vue'
import useClusters from '@/composables/useClusters.js'
import useSites from '@/composables/useSites.js'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { PaperAirplaneIcon } from '@heroicons/vue/20/solid'
import { isEmpty } from 'lodash'

const { addCluster } = useClusters()
const { getSites, sites } = useSites()

const props = defineProps({
  nodes: {
    type: Object
  }
})

const emit = defineEmits(['clusterAdded'])

const form = ref({})

function hydrateForm() {
  return {
    name: '',
    cluster: {
      ip: '',
      hostname: '',
      subnet: props.nodes[0].cvm.subnet,
      gateway: props.nodes[0].cvm.gateway
    },
    vcenter: {},
    prismCentral: {},
    aos: {},
    hypervisor: {},
    site: {},
    nodes: props.nodes
  }
}

const isVisible = ref(false)
function siteChanged(event) {
  // Prism Central Combobox
  if (form.value.site?.pcServers.filter(pc => pc.default).length != 0) {
    form.value.prismCentral = form.value.site.pcServers.find(pc => pc.default)
  } else {
    form.value.prismCentral = {}
  }

  // vCenter Combobox
  if (form.value.site?.vCenterServers.filter(vcenter => vcenter.default).length != 0) {
    form.value.vcenter = form.value.site.vCenterServers.find(vcsa => vcsa.default)
  } else {
    form.value.vcenter = {}
  }

  // Hypervisor Combobox
  form.value.hypervisor = {}

  // AOS Combobox
  form.value.aos = {}
}

const isSiteSelected = computed(() => {
  return !isEmpty(form.value.site)
})

const vCenterPlaceholder = computed(() => {
  let placeholder = 'Please Select Site'
  if(isSiteSelected.value) {
    if (form.value.site?.vCenterServers?.length == 0) {
      placeholder = 'No Site vCenters'
    } else if (form.value.site?.vCenterServers.filter(vcenter => vcenter.default).length == 0) {
      placeholder= 'No Site Default vCenter'
    }
  }

  return placeholder
})


const pcPlaceholder = computed(() => {
  let placeholder = 'Please Select Site'
  if(isSiteSelected.value) {
    if (form.value.site?.pcServers?.length == 0) {
      placeholder = 'No Site Prism Central Servers'
    } else if (form.value.site?.pcServers.filter(pc => pc.default).length == 0) {
      placeholder= 'No Site Default Prism Central'
    }
  }

  return placeholder
})

const aosPlaceholder = computed(() =>  {
  let placeholder = 'Please Select Site'
  if (isSiteSelected.value) {
    placeholder = form.value.site.aosList.length == 0 ? 'No Site AOS' : undefined
  }
  return placeholder
})

const hypervisorPlaceholder = computed(() =>  {
  let placeholder = 'Please Select Site'
  if (isSiteSelected.value) {
    placeholder = form.value.site.hypervisorList.length == 0 ? 'No Site Hypervisor' : undefined
  }
  return placeholder
})

async function open() {
  isVisible.value = true
  form.value = hydrateForm()
  await getSites()
}
function close() {
  isVisible.value = false
}

async function add() {
  try {
    let newCluster = await addCluster(form.value)
    emit('clusterAdded', newCluster)
    close()
  } catch (err) {
  }
}


</script>

<template>
  <slot name="activator" v-if="$slots.activator" :open="open"></slot>
  <TransitionRoot as="template" :show="isVisible">
    <Dialog as="div" class="relative z-50" @close="close">

      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <TransitionChild as="template" enter="transform transition ease-in-out duration-500 sm:duration-700" enter-from="translate-x-full" enter-to="translate-x-0" leave="transform transition ease-in-out duration-500 sm:duration-700" leave-from="translate-x-0" leave-to="translate-x-full">
              <DialogPanel class="pointer-events-auto w-screen max-w-lg">
                <div class="flex h-full flex-col bg-white shadow-xl">
                  <div class="sticky top-0 bg-indigo-700 py-6 px-4 sm:px-6">
                    <div class="flex items-center justify-between">
                      <DialogTitle class="text-lg font-semibold text-white">
                        Create Cluster
                        <div class="mt-1">
                          <p class="text-sm font-normal text-indigo-300">Input cluster details</p>
                        </div>
                      </DialogTitle>
                      <div class="ml-3 flex h-7 items-center">

                        <Button @click="add" class="pr-2">
                          <PaperAirplaneIcon class="hidden lg:block -ml-2 w-5 h-5 shrink-0" />
                          Add
                        </Button>
                        <button type="button" class="rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white" @click="close">
                          <span class="sr-only">Close panel</span>
                          <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="relative flex-1 flex-col py-4 px-4 sm:px-6 space-y-2.5 overflow-y-auto">
                    <div class="relative flex items-center">
                      <label for="clusterName" class="mr-2 text-charcoal-800 dark:text-charcoal-200"> Cluster Name:</label>
                      <input type="text" id="clusterName" v-model="form.name" class="grow rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>
                    <Combobox
                      v-model="form.site"
                      inlineLabel="Site:"
                      @update:model-value="siteChanged"
                      placeholder="Select Site"
                      autocomplete
                    >
                      <Option v-for="site in sites" :key="site.id" :value="site" >{{ site.name }}</Option>
                    </Combobox>

                    <div class="relative flex items-center">
                      <label for="dataservicesVIP" class="mr-2 text-charcoal-800 dark:text-charcoal-200"> Data Services VIP:</label>
                      <input type="text" id="dataservicesVIP" class="grow rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>
                    <div class="relative flex items-center">
                      <label for="clusterHostName" class="mr-2 text-charcoal-800 dark:text-charcoal-200"> Cluster Host Name:</label>
                      <input type="text" id="clusterHostName" v-model="form.cluster.hostname" class="grow rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>
                    <div class="relative flex items-center">
                      <label for="clusterVIP" class="mr-2 text-charcoal-800 dark:text-charcoal-200"> Cluster VIP:</label>
                      <input type="text" id="clusterVIP" v-model="form.cluster.ip" class="grow rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>
                    <div class="relative hidden items-center">
                      <label for="clusterGateway" class="mr-2 text-charcoal-800 dark:text-charcoal-200"> Cluster Gateway:</label>
                      <input type="text" id="clusterGateway" v-model="form.cluster.gateway" class="grow rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>
                    <div class="relative hidden items-center">
                      <label for="clusterSubnet" class="mr-2 text-charcoal-800 dark:text-charcoal-200"> Cluster Subnet:</label>
                      <input type="text" id="clusterSubnet" v-model="form.cluster.subnet" class="grow rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>

                    <Combobox
                      v-model="form.prismCentral"
                      inlineLabel="Prism Central:"
                      :disabled="!isSiteSelected || form.site.pcServers.length == 0"
                      :placeholder="pcPlaceholder"
                    >
                      <Option v-for="prismCentral in form.site?.pcServers" :key="prismCentral.id" :value="prismCentral">
                        {{ prismCentral.displayName }} {{ prismCentral.default ? '(Site Default)' : '' }}
                      </Option>
                    </Combobox>
                    <Combobox
                      v-model="form.vcenter"
                      inlineLabel="vCenter Server:"
                      :disabled="!isSiteSelected || form.site.vCenterServers.length == 0"
                      :placeholder="vCenterPlaceholder"
                    >
                      <Option v-for="vCenter in form.site?.vCenterServers" :key="vCenter.id" :value="vCenter">
                        {{ vCenter.displayName }} {{ vCenter.default ? '(Site Default)' : '' }}
                      </Option>
                    </Combobox>
                    <Combobox
                      v-model="form.hypervisor"
                      inlineLabel="Hypervisor:"
                      :disabled="!isSiteSelected || form.site.hypervisorList.length == 0"
                      :placeholder="hypervisorPlaceholder"
                    >
                      <Option v-for="hypervisor in form.site?.hypervisorList" :key="hypervisor.uuid" :value="hypervisor">{{ hypervisor.name }}</Option>
                    </Combobox>
                    <Combobox
                      v-model="form.aos"
                      inlineLabel="AOS:"
                      :disabled="!isSiteSelected || form.site.aosList.length == 0"
                      :placeholder="aosPlaceholder"
                    >
                      <Option v-for="aos in form.site?.aosList" :key="aos.uuid" :value="aos">{{ aos.name }}</Option>
                    </Combobox>
                    <!-- Nodes in Cluster -->
                    <div class="bg-gray-100 rounded-lg">
                      <h3 class="pl-2 py-2 text-charcoal-800 dark:text-charcoal-200">Nodes:</h3>
                      <ul class="px-4 pb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 overflow-y-auto">
                        <li v-for="node in form.nodes" :key="node.serial" class="col-span-1 bg-white rounded-lg shadow px-1.5 py-1 text-sm">
                          <p>
                            <span class="pr-2">Host:</span>
                            <span>{{ node.host.hostname }}</span>
                          </p>
                          <p>
                            <span class="pr-2">Serial:</span>
                            <span>{{ node.serial }}</span>
                          </p>
                        </li>
                      </ul>
                    </div>
                    <!-- <div class="absolute inset-0 py-6 px-4 sm:px-6">
                      <div class="h-full border-2 border-dashed border-gray-200" aria-hidden="true" />
                    </div> -->
                    <!-- /End replace -->
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
