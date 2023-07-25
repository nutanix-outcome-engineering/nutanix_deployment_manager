<script setup>
import { ref, computed } from 'vue'
import { startCase, range } from 'lodash'
import { Cog6ToothIcon, PaperAirplaneIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import IngestNodesModal from '@/views/Nodes/IngestNodesModal.vue';
import DisplayNodeDrawer from './DisplayNodeDrawer.vue';
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
const displayNodeDetails = ref(false)
const editing = ref(false)

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
  if (selectedNode?.value?.id == node.id && displayNodeDetails.value) {
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
  if (selectedNode?.value?.id != node.id || (selectedNode?.value?.id == node.id && !displayNodeDetails.value)) {
    displayNodeDetails.value = true
  } else if (selectedNode?.value?.id == node.id) {
    displayNodeDetails.value = false
  }
  selectedNode.value = node
}

function nodeAdded() {
  displayNodeDetails.value = false
  selectedNode.value = null
}

function nodeUpdated(id) {
  selectedNode.value = ingestingNodes.value.filter(node => node.id == id)[0]
}

function closeNodeDrawer() {
  displayNodeDetails.value = false
}

async function retryDiscoverNode(id) {
  await retryDiscovery([id])
  displayNodeDetails.value = false
  selectedIngesting.value.splice(selectedIngesting.value.indexOf(id), 1)
}
</script>

<template>
<div class="flex flex-1 flex-row">
  <div class="flex flex-1 flex-col p-5">
      <!-- Ingestion Processing Table -->
      <div class="flex flex-auto flex-col h-0 max-h-[50%]">
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
        <div class="mt-4 overflow-y-auto overscroll-contain">
          <div v-if="ingestingNodes.filter(n => n.ingestState != 'pendingReview').length"
            class="-my-2 -mx-4  sm:-mx-6 lg:-mx-8">
            <div class="inline-block w-full py-2 align-middle md:px-6 lg:px-8">
              <div class="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table class="w-full border-separate border-spacing-0">
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
                  <tbody>
                    <tr v-for="(node, idx) in ingestingNodes.filter(n => n.ingestState != 'pendingReview')" :key="node.id"
                      :class="rowClass(node, idx)">
                      <td class="relative w-12 px-6 sm:w-16 sm:px-8">
                        <div v-if="selectedIngesting.includes(node.id)" class="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>
                        <input type="checkbox"
                          class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                          :value="node.id" v-model="selectedIngesting" />
                      </td>
                      <td @click="displayNode(node)"
                        :class="['whitespace-nowrap px-3 py-4 text-sm font-medium cursor-pointer hover:underline decoration-from-font', selectedIngesting.includes(node.id) ? 'text-indigo-600' : 'text-gray-900']">
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
      <!-- Pending Review Table -->
      <div class="flex flex-auto flex-col h-0 max-h-[50%]">
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
        <div class="mt-4 overflow-y-auto overscroll-contain">
          <div v-if="pendingReview.length" class="-my-2 -mx-4  sm:-mx-6 lg:-mx-8">
            <div class="inline-block w-full py-2 align-middle md:px-6 lg:px-8">
              <div class="relative shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <div class="relative shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table class="w-full border-separate border-spacing-0">
                    <thead class="bg-gray-200">
                      <tr>
                        <th scope="col"
                          class="z-10 sticky border-b border-gray-300 top-0 w-12 px-6 sm:w-16 sm:px-8 backdrop-blur backdrop-filter">
                          <input type="checkbox"
                            class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                            :checked="indeterminatePendingReview || selectedPendingReview.length === pendingReview.length && pendingReview.length > 0"
                            :indeterminate="indeterminatePendingReview"
                            @change="selectedPendingReview = $event.target.checked ? pendingReview.map((n) => n.id) : []" />
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
                    <tbody class="divide-y divide-gray-200">
                      <tr v-for="(node, idx) in pendingReview" :key="node.id" :class="rowClass(node, idx)">
                        <td class="relative w-12 px-6 sm:w-16 sm:px-8">
                          <div v-if="selectedPendingReview.includes(node.id)" class="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>
                          <input type="checkbox"
                            class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                            :value="node.id" v-model="selectedPendingReview" />
                        </td>
                        <td @click="displayNode(node)"
                          :class="['whitespace-nowrap px-3 py-4 text-sm font-medium cursor-pointer hover:underline decoration-from-font', selectedPendingReview.includes(node.id) ? 'text-indigo-600' : 'text-gray-900']">
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
  <div v-if="displayNodeDetails" class="basis-1/4 w-1/4 h-full max-w-[25%] -ml-2">
    <DisplayNodeDrawer @nodeAdded="nodeAdded" @nodeUpdated="nodeUpdated"
      @closeNodeDrawer="closeNodeDrawer" @retryDiscovery="retryDiscoverNode"
      :node="selectedNode" :show="displayNodeDetails"
    />
  </div>
</div>


</template>



