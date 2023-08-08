<script setup>
import { ref, computed, defineEmits } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxLabel,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/vue'
import Button from '@/components/Core/Button.vue'
import useClusters from '@/composables/useClusters.js'
import useSites from '@/composables/useSites.js'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { CheckIcon, ChevronUpDownIcon, PaperAirplaneIcon } from '@heroicons/vue/20/solid'

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
    name: 'aset',
    cluster: {
      ip: '',
      hostname: '',
      subnet: props.nodes[0].cvm.subnet,
      gateway: props.nodes[0].cvm.gateway
    },
    vcenter: {
      ip: '',
      hostname: '',
      subnet: '',
      gateway: ''
    },
    prismCentral: {
      ip: '',
      hostname: '',
      subnet: '',
      gateway: ''
    },
    site: {name: "Select Site"},
    selectedHypervisor: null,
    selectedAOS: null,
    nodes: props.nodes
  }
}

const isVisible = ref(false)
const siteQuery = ref('')
const filteredSites = computed(() =>
  siteQuery.value === '' ? sites.value : sites.value.filter((site) => {
    return site.name.toLowerCase().includes(siteQuery.value.toLowerCase())
  })
)
const hypervisorQuery = ref('')
const hypervisors = [ 'AHV', 'ESXi 7.0', 'ESXi 6.0']
const filteredHypervisor = computed(() =>
  hypervisorQuery.value === '' ? hypervisors : hypervisors.filter((hypervisor) => {
    return hypervisor.toLowerCase().includes(hypervisorQuery.value.toLowerCase())
  })
)
const aosQuery = ref('')
const aoss = [ '6.5', '5.20', '6.6']
const filteredAOS = computed(() =>
  aosQuery.value === '' ? aoss : aoss.filter((aos) => {
    return aos.toLowerCase().includes(aosQuery.value.toLowerCase())
  })
)
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
    emit('clusterAdded', newCluster.id)
    close()
  } catch (err) {
    console.log(err)
  }
}


</script>

<template>
  <slot name="activator" v-if="$slots.activator" :open="open"></slot>
  <TransitionRoot as="template" :show="isVisible">
    <Dialog as="div" class="relative z-10" @close="close">
      <div class="fixed inset-0" />

      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <TransitionChild as="template" enter="transform transition ease-in-out duration-500 sm:duration-700" enter-from="translate-x-full" enter-to="translate-x-0" leave="transform transition ease-in-out duration-500 sm:duration-700" leave-from="translate-x-0" leave-to="translate-x-full">
              <DialogPanel class="pointer-events-auto w-screen max-w-md">
                <div class="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div class="bg-indigo-700 py-6 px-4 sm:px-6">
                    <div class="flex items-center justify-between">
                      <DialogTitle class="text-lg font-medium text-white">Create Cluster</DialogTitle>
                      <div class="ml-3 flex h-7 items-center">

                        <Button @click="add">
                          <PaperAirplaneIcon class="hidden lg:block -ml-2 w-5 h-5 shrink-0" />
                          Add
                        </Button>
                        <button type="button" class="rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white" @click="close">
                          <span class="sr-only">Close panel</span>
                          <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div class="mt-1">
                      <p class="text-sm text-indigo-300">Input cluster details</p>
                    </div>
                  </div>
                  <div class="relative flex-1 flex-col py-6 px-4 sm:px-6">
                    <!-- Replace with your content -->
                    <div class="pb-2">
                      <label for="clusterName" class="pb-0 text-sm font-medium text-gray-900"> Cluster Name:
                        <input type="text" id="clusterName" v-model="form.name" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                      </label>
                    </div>
                    <Combobox class="relative flex pb-2 mt-2" as="div" v-model="form.site">
                      <ComboboxLabel class="block text-sm font-medium leading-6 text-gray-900 mr-2 pt-1">Site:</ComboboxLabel>
                      <ComboboxInput class="grow rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" @focus="e => e.target.select()" @change="siteQuery = $event.target.value" :display-value="(selectedSite) => selectedSite?.name" />
                      <ComboboxButton class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 pb-2 focus:outline-none">
                        <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </ComboboxButton>

                      <ComboboxOptions v-if="filteredSites.length > 0" class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        <ComboboxOption :value="form.site" disabled active hidden>Select Site</ComboboxOption>
                        <ComboboxOption v-for="site in filteredSites" :key="site.id" :value="site" as="template" v-slot="{ active, selected }">
                          <li :class="['relative cursor-default select-none py-2 pl-8 pr-4', active ? 'bg-indigo-600 text-white' : 'text-gray-900']">
                            <span :class="['block truncate', selected && 'font-semibold']">
                              {{ site.name }}
                            </span>

                            <span v-if="selected" :class="['absolute inset-y-0 left-0 flex items-center pl-1.5', active ? 'text-white' : 'text-indigo-600']">
                              <CheckIcon class="h-5 w-5" aria-hidden="true" />
                            </span>
                          </li>
                        </ComboboxOption>
                      </ComboboxOptions>
                    </Combobox>
                    <div class="pb-2">
                      <div class="pb-2">
                        <label for="dataservicesVIP" class="pb-0 text-sm font-medium text-gray-900"> Data Services VIP:
                          <input type="text" id="dataservicesVIP" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                        </label>
                      </div>
                      <div class="pb-2">
                        <label for="clusterHostName" class="pb-0 text-sm font-medium text-gray-900"> Cluster Host Name:
                          <input type="text" id="clusterHostName" v-model="form.cluster.hostname" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                        </label>
                      </div>
                      <div class="pb-2">
                        <label for="clusterVIP" class="pb-0 text-sm font-medium text-gray-900"> Cluster VIP:
                          <input type="text" id="clusterVIP" v-model="form.cluster.ip" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                        </label>
                      </div>
                      <div class="pb-2">
                        <label for="clusterGatway" class="pb-0 text-sm font-medium text-gray-900"> Cluster Gateway:
                          <input type="text" id="clusterGateway" v-model="form.cluster.gateway" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                        </label>
                      </div>
                      <div class="pb-2">
                        <label for="clusterSubnet" class="pb-0 text-sm font-medium text-gray-900"> Cluster Subnet:
                          <input type="text" id="clusterSubnet" v-model="form.cluster.subnet" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                        </label>
                      </div>
                    </div>
                    <div class="pb-2">
                      <label for="pcHostName" class="pb-0 text-sm font-medium text-gray-900"> Prism Central Host Name:
                        <input type="text" id="pcHostName" v-model="form.prismCentral.hostname" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                      </label>
                    </div>
                    <div class="pb-2">
                      <label for="pcIP" class="pb-0 text-sm font-medium text-gray-900"> Prism Central IP:
                        <input type="text" id="pcIP" v-model="form.prismCentral.ip" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                      </label>
                    </div>
                    <div class="pb-2">
                      <label for="pcGatway" class="pb-0 text-sm font-medium text-gray-900"> Prism Central Gateway:
                        <input type="text" id="pcGateway" v-model="form.prismCentral.gateway" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                      </label>
                    </div>
                    <div class="pb-2">
                      <label for="pcSubnet" class="pb-0 text-sm font-medium text-gray-900"> Prism Central Subnet:
                        <input type="text" id="pcSubnet" v-model="form.prismCentral.subnet" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                      </label>
                    </div>
                    <div class="pb-2">
                      <label for="vcHostName" class="pb-0 text-sm font-medium text-gray-900"> vCenter Host Name:
                        <input type="text" id="vcHostName" v-model="form.vcenter.hostname" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                      </label>
                    </div>
                    <div class="pb-2">
                      <label for="vcIP" class="pb-0 text-sm font-medium text-gray-900"> vCenter IP:
                        <input type="text" id="vcIP" v-model="form.vcenter.ip" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                      </label>
                    </div>
                    <div class="pb-2">
                      <label for="vcGateway" class="pb-0 text-sm font-medium text-gray-900"> vCenter Gateway:
                        <input type="text" id="vcGateway" v-model="form.vcenter.gateway" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                      </label>
                    </div>
                    <div class="pb-2">
                      <label for="vcSubnet" class="pb-0 text-sm font-medium text-gray-900"> vCenter Subnet:
                        <input type="text" id="vcSubnet" v-model="form.vcenter.subnet" class="relative text-sm text-gray-900 sm:mt-0 rounded-md border"/>
                      </label>
                    </div>
                    <Combobox class="relative flex pb-2 mt-2" as="div" v-model="form.selectedHypervisor">
                        <ComboboxLabel class="pt-1 leading-6 text-sm font-medium text-gray-900 mr-2">Hypervisor:</ComboboxLabel>
                        <ComboboxInput class="grow rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          @change="hypervisorQuery = $event.target.value" :display-value="(selectedHypervisor) => selectedHypervisor" />
                        <ComboboxButton class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 pb-2 focus:outline-none">
                          <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </ComboboxButton>

                        <ComboboxOptions v-if="filteredHypervisor.length > 0" class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          <ComboboxOption v-for="hypervisor in filteredHypervisor" :key="hypervisor" :value="hypervisor" as="template" v-slot="{ active, selected }">
                            <li :class="['relative cursor-default select-none py-2 pl-8 pr-4', active ? 'bg-indigo-600 text-white' : 'text-gray-900']">
                              <span :class="['block truncate', selected && 'font-semibold']">
                                {{ hypervisor }}
                              </span>

                              <span v-if="selected" :class="['absolute inset-y-0 left-0 flex items-center pl-1.5', active ? 'text-white' : 'text-indigo-600']">
                                <CheckIcon class="h-5 w-5" aria-hidden="true" />
                              </span>
                            </li>
                          </ComboboxOption>
                        </ComboboxOptions>
                    </Combobox>
                     <Combobox class="relative flex mt-2 pb-2" as="div" v-model="form.selectedAOS">
                        <ComboboxLabel class="block pt-1 text-sm font-medium leading-6 text-gray-900 mr-2">AOS:</ComboboxLabel>
                        <ComboboxInput class="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          @change="aosQuery = $event.target.value" :display-value="(selectedAOS) => selectedAOS" />
                        <ComboboxButton class="absolute inset-y-0 right-0 flex items-center rounded-r-md pb-2 px-2 focus:outline-none">
                          <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </ComboboxButton>

                        <ComboboxOptions v-if="filteredAOS.length > 0" class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          <ComboboxOption v-for="aos in filteredAOS" :key="aos" :value="aos" as="template" v-slot="{ active, selected }">
                            <li :class="['relative cursor-default select-none py-2 pl-8 pr-4', active ? 'bg-indigo-600 text-white' : 'text-gray-900']">
                              <span :class="['block truncate', selected && 'font-semibold']">
                                {{ aos }}
                              </span>

                              <span v-if="selected" :class="['absolute inset-y-0 left-0 flex items-center pl-1.5', active ? 'text-white' : 'text-indigo-600']">
                                <CheckIcon class="h-5 w-5" aria-hidden="true" />
                              </span>
                            </li>
                          </ComboboxOption>
                        </ComboboxOptions>
                    </Combobox>
                    <!-- Nodes in Cluster -->
                    <div class="bg-gray-100 rounded-lg py-2">
                      <h3 class="pl-2 pt-1 text-lg leading-6 font-medium text-gray-900">Nodes:</h3>
                      <ul class="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <li v-for="node in form.nodes" :key="node.serial" class="col-span-1 bg-white rounded-lg shadow">
                          {{ node.host.hostname }}
                          {{ node.serial }}
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
