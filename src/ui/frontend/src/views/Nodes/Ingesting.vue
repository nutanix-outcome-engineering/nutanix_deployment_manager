<script setup>
import { ref, computed } from 'vue'
import { startCase, range } from 'lodash'
import { Cog6ToothIcon, PaperAirplaneIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import IngestNodesModal from '@/views/Nodes/IngestNodesModal.vue';
import DisplayNodeModal from './DisplayNodeModal.vue';
import Button from '@/components/Core/Button.vue'
import useNodes from '@/composables/useNodes.js'

const { getIngestingNodes,
  ingestingNodes,
  isLoading,
  ingestIPRange,
  addNodes,
  retryDiscovery
} = useNodes()


const selectedPendingReview = ref([])
const checkedPendingReview = computed(() => selectedPendingReview.value.length > 0)
const indeterminatePendingReview = computed(() => selectedPendingReview.value.length > 0 && selectedPendingReview.value.length < ingestingNodes.value.length)
const pendingReview = computed(() => ingestingNodes.value.filter(n => n.ingestState == 'pendingReview'))
const maxNicCount = computed(() => pendingReview.value.reduce((maxSize, current) => current.nicInfo?.length > maxSize ? current.nicInfo.length : maxSize, 0))

const selectedIngesting = ref([])
const checkedIngesting = computed(() => selectedIngesting.value.length > 0)
const indeterminateIngesting = computed(() => selectedIngesting.value.length > 0 && selectedIngesting.value.length < ingestingNodes.value.length)

const selectedNode = ref(null)
const editing = ref(false)

function edit() {
  editing.value = !editing.value
}

// setTimeout(getIngestingNodes, 5000)
async function addChecked() {
  const nodesToAdd = ingestingNodes.value.filter(node => selectedPendingReview.value.includes(node.id))

  await addNodes(nodesToAdd)
}

async function retryList(retry) {
  if (retry == 'pending') {
    await retryDiscovery(selectedPendingReview.value)
    selectedPendingReview.value = []
  } else {
    await retryDiscovery(selectedIngesting.value)
    selectedIngesting.value = []
  }
}

function rowClass(node, idx) {
  let cssClass = ''

  if (selectedPendingReview.value.includes(node.id)) {
    cssClass = 'bg-gray-50'
  } else if (idx % 2 == 1) {
    cssClass = 'bg-blue-100'
  }
  if (selectedNode?.value?.id == node.id) {
    cssClass = 'bg-gray-100'
  }
  if (node.ingestState == 'failed') {
    cssClass = 'bg-red-100'
  } else if (node.ingestState == 'ingesting') {
    cssClass = 'bg-yellow-100'
  }

  return cssClass
}

function displayNode(node) {
  if (selectedNode?.value?.id == node.id) {
    selectedNode.value = null
  } else {
    selectedNode.value = node
  }
}
</script>

<template>
  <div class="mx-auto w-full h-full flex flex-row flex-grow">
    <!--  Table Displays -->
    <div class="lg:basis-3/4 lg:w-3/4 py-6 sm:px-6 lg:px-8 flex flex-col space-y-4 flex-1">
      <!-- Ingestion Processing Table -->
      <div>
        <div class="sm:flex sm:items-center">
          <div class="sm:flex-auto">
            <h2 class="text-xl font-semibold text-gray-900">Ingesting Nodes</h2>
          </div>
          <div class="space-x-4">
            <Button @click="retryList('ingesting')" :disabled="!checkedIngesting">
              <Cog6ToothIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
              Retry Checked
            </Button>
            <IngestNodesModal @ingestByRange="ingestIPRange" />
          </div>
        </div>
        <div class="mt-4 flow-root overflow-y-auto">
          <div v-if="ingestingNodes.filter(n => n.ingestState != 'pendingReview').length"
            class="-my-2 -mx-4  sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div class="relative shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table class="min-w-full border-separate border-spacing-0 table-fixed">
                  <thead class="bg-gray-200">
                    <tr>
                      <th scope="col"
                        class="sticky top-0 z-10 border-b border-gray-300 bg-opacity-75 w-12 px-6 sm:w-16 sm:px-8 backdrop-blur backdrop-filter">
                        <input type="checkbox"
                          class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                          :checked="indeterminateIngesting || selectedIngesting.length === ingestingNodes.length && ingestingNodes.length > 0"
                          :indeterminate="indeterminateIngesting"
                          @change="selectedIngesting = $event.target.checked ? ingestingNodes.map((n) => n.id) : []" />
                      </th>
                      <th scope="col"
                        class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                        IPMI IP</th>
                      <th scope="col"
                        class="z-10 sticky border-b  border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                        Ingest Status</th>
                      <th scope="col"
                        class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                        Failure Reason</th>
                      <th scope="col"
                        class="z-10 sticky border-b border-gray-300 top-0 py-3.5 pl-3 pr-4 sm:pr-6 backdrop-blur backdrop-filter">
                        <span class="sr-only">Retry Ingest</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    <tr v-for="(node, idx) in ingestingNodes.filter(n => n.ingestState != 'pendingReview')"
                      :key="node.id" :class="rowClass(node, idx)">
                      <td class="relative w-12 px-6 sm:w-16 sm:px-8">
                        <div v-if="selectedIngesting.includes(node.id)"
                          class="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>
                        <input type="checkbox"
                          class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                          :value="node.id" v-model="selectedIngesting" />
                      </td>
                      <td
                        :class="['whitespace-nowrap px-3 py-4 text-sm font-medium', selectedIngesting.includes(node.id) ? 'text-indigo-600' : 'text-gray-900']">
                        <!-- <DisplayNodeModal :node="node">{{ node.ipmiIP }}</DisplayNodeModal> -->
                        {{ node.ipmi.ip }}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {{ startCase(node.ingestState) }}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {{ node.failureReason || "N/A" }}
                      </td>
                      <td class="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button @click="retryDiscovery([node.id])" class="text-indigo-600 hover:text-indigo-900">
                          Retry Ingest<span class="sr-only">, {{ node.ipmiIP }}</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!--Ingestion Processing Table End-->

      <!--<div> Pending Review Table -->
      <div>
        <div class="sm:flex sm:items-center mt-4">
          <div class="sm:flex-auto">
            <h2 class="text-xl font-semibold text-gray-900">Nodes Pending Review</h2>
          </div>
          <div class="space-x-4">
            <Button @click="retryList('pending')" :disabled="!checkedPendingReview">
              <Cog6ToothIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
              Retry Checked
            </Button>
            <Button v-tippy="{content: 'Adds checked nodes to inventory'}" @click="addChecked" :disabled="!checkedPendingReview">
              <PaperAirplaneIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
              Add Checked
            </Button>
          </div>
        </div>
        <div class="mt-8 overflow-y-auto">
          <div v-if="pendingReview.length" class="-my-2 -mx-4  sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div class="relative shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <div class="relative shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table class="min-w-full border-separate border-spacing-0 table-fixed ">
                    <thead class="bg-gray-200">
                      <tr>
                        <th scope="col"
                          class="z-10 sticky border-b border-gray-300 top-0 w-12 px-6 sm:w-16 sm:px-8 backdrop-blur backdrop-filter">
                          <input type="checkbox"
                            class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                            :checked="indeterminatePendingReview || selectedPendingReview.length === ingestingNodes.length && ingestingNodes.length > 0"
                            :indeterminate="indeterminatePendingReview"
                            @change="selectedPendingReview = $event.target.checked ? ingestingNodes.map((n) => n.id) : []" />
                        </th>
                        <th scope="col"
                          class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                          IPMI IP</th>
                        <th scope="col"
                          class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                          Host Hostname</th>
                        <th scope="col"
                          class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                          CVM IP</th>
                        <th scope="col"
                          class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                          Serial</th>
                        <template v-for="nic in range(maxNicCount)">
                          <th scope="col"
                            class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                            NIC Name</th>
                          <th scope="col"
                            class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                            Switch Port</th>
                          <th scope="col"
                            class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                            Switch MAC</th>
                        </template>
                        <th scope="col"
                          class="z-10 sticky border-b border-gray-300 top-0 py-3.5 pl-3 pr-4 sm:pr-6 backdrop-blur backdrop-filter">
                          <span class="sr-only">Edit</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                      <tr v-for="(node, idx) in pendingReview" :key="node.id" :class="rowClass(node, idx)">
                        <td class="relative w-12 px-6 sm:w-16 sm:px-8">
                          <div v-if="selectedPendingReview.includes(node.id)"
                            class="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>
                          <input type="checkbox"
                            class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                            :value="node.id" v-model="selectedPendingReview" />
                        </td>
                        <td @click="displayNode(node)"
                          :class="['whitespace-nowrap px-3 py-4 text-sm font-medium', selectedPendingReview.includes(node.id) ? 'text-indigo-600' : 'text-gray-900']">
                          <!-- <DisplayNodeModal :node="node">{{ node.ipmiIP }}</DisplayNodeModal> -->
                          {{ node.ipmi.ip }}
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {{ node.host.hostname }}
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {{ node.cvm.ip }}
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {{ node.serial }}
                        </td>
                        <template v-for="nic in range(maxNicCount)">
                          <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {{ node.nicInfo[nic]?.nicName || "N/A" }}
                          </td>
                          <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {{ node.nicInfo[nic]?.switchPort || "N/A" }}
                          </td>
                          <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {{ node.nicInfo[nic]?.switchMac || "N/A" }}
                          </td>
                        </template>
                        <td class="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button v-tippy="{content: 'Adds node to inventory'}" @click="addNodes([node])" class="text-indigo-600 hover:text-indigo-900">
                            Add Node<span class="sr-only">, {{ node.ipmi.ip }}</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!--Pending Review Table End -->
    </div>

    <!-- Node Data Display -->
    <div v-if="selectedNode" class="basis-1/4 w-1/4 h-full max-w-[25%] pl-2">
      <div class="relative flex flex-row justify-between pr-2">
        <div class="text-lg font-medium leading-6 text-gray-900">Node Information
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Details about the node.</p>
        </div>
        <div class="">
          <Button @click="edit" :disabled="!checkedPendingReview">
            <PencilSquareIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
            Edit
          </Button>
        </div>
      </div>
      <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
        <div class="sm:divide-y sm:divide-gray-200">
          <div class="py-4 sm:py-5 sm:px-4">
            <p class="max-w-2xl text-sm font-medium mb-1 text-gray-500 pb-1 ">Details about the IPMI</p>

            <div class="px-2 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-col-2">
              <div class="sm:col-span-1">
                <label for="ipmiIP" class="pb-0 text-sm font-normal text-gray-500">IPMI IP</label><br />
                <input type="text" id="ipmiIP" v-model="selectedNode.ipmi.ip" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
              <div class="sm:col-span-1">
                <label for="ipmiHostname" class="pb-1 text-sm font-normal text-gray-500">IPMI Hostname</label><br />
                <input type="text" id="ipmiHostname" v-model="selectedNode.ipmi.hostname" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
              <div class="sm:col-span-1">
                <label for="ipmiSubnet" class="pb-1 text-sm font-normal text-gray-500">IPMI Subnet</label><br />
                <input type="text" id="ipmiSubnet" v-model="selectedNode.ipmi.subnet" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
              <div class="sm:col-span-1">
                <label for="ipmiGateway" class="pb-1 text-sm font-normal text-gray-500">IPMI Gateway</label><br />
                <input type="text" id="ipmiGateway" v-model="selectedNode.ipmi.gateway" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
            </div>
          </div>
          <div class="py-4 sm:py-5 sm:px-4">
            <p class="max-w-2xl text-sm font-medium mb-1 text-gray-500 pb-1 ">Details about the Host</p>
            <div class="px-2 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-col-2">
              <div class="sm:col-span-1">
                <label for="hostIP" class="pb-0 text-sm font-normal text-gray-500">Host IP</label><br />
                <input type="text" id="hostIP" v-model="selectedNode.host.ip" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
              <div class="sm:col-span-1">
                <label for="hostHostname" class="pb-1 text-sm font-normal text-gray-500">Host Hostname</label><br />
                <input type="text" id="hostHostname" v-model="selectedNode.host.hostname" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
              <div class="sm:col-span-1">
                <label for="hostSubnet" class="pb-1 text-sm font-normal text-gray-500">Host Subnet</label><br />
                <input type="text" id="hostSubnet" v-model="selectedNode.host.subnet" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
              <div class="sm:col-span-1">
                <label for="hostGateway" class="pb-1 text-sm font-normal text-gray-500">Host Gateway</label><br />
                <input type="text" id="hostGateway" v-model="selectedNode.host.gateway" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
            </div>
          </div>
          <div class="py-4 sm:py-5 sm:px-4">
            <p class="max-w-2xl text-sm font-medium mb-1 text-gray-500 pb-1 ">Details about the CVM</p>
            <div class="px-2 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-col-2">
              <div class="sm:col-span-1">
                <label for="cvmIP" class="pb-0 text-sm font-normal text-gray-500">CVM IP</label><br />
                <input type="text" id="cvmIP" v-model="selectedNode.cvm.ip" :disabled="!editing" placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
              <div class="sm:col-span-1">
                <label for="cvmHostname" class="pb-1 text-sm font-normal text-gray-500">CVM Hostname</label><br />
                <input type="text" id="cvmHostname" v-model="selectedNode.cvm.hostname" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
              <div class="sm:col-span-1">
                <label for="cvmSubnet" class="pb-1 text-sm font-normal text-gray-500">CVM Subnet</label><br />
                <input type="text" id="cvmSubnet" v-model="selectedNode.cvm.subnet" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
              <div class="sm:col-span-1">
                <label for="cvmGateway" class="pb-1 text-sm font-normal text-gray-500">CVM Gateway</label><br />
                <input type="text" id="cvmGateway" v-model="selectedNode.cvm.gateway" :disabled="!editing"
                  placeholder="10.1.1.1"
                  class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>



