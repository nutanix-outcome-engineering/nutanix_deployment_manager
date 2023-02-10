<script setup>
import { ref, computed } from 'vue'
import DisplayNodeModal from './DisplayNodeModal.vue';
import useNodes from '@/composables/useNodes.js'

const { getNodes, nodes, isLoading } = useNodes()


const selectedNodes = ref([])
const checked = computed(() => selectedNodes.value.length > 0)
const indeterminate = computed(() => selectedNodes.value.length > 0 && selectedNodes.value.length < nodes.value.length)

// setTimeout(getNodes, 5000)

</script>

<template>
  <div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h2 class="text-xl font-semibold text-gray-900">Nodes</h2>
        </div>
      </div>
      <div class="mt-8 flex flex-col max-h-screen overflow-y-auto">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div class="relative shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table v-if="nodes" class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="z-10 sticky border-b border-gray-300 top-0 w-12 px-6 sm:w-16 sm:px-8 backdrop-blur backdrop-filter">
                      <input type="checkbox" class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6" :checked="indeterminate || selectedNodes.length === nodes.length" :indeterminate="indeterminate" @change="selectedNodes = $event.target.checked ? nodes.map((n) => n.serial) : []" />
                    </th>
                    <th scope="col" class="z-10 sticky border-b border-gray-300 top-0 min-w-[12rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">IPMI IP</th>
                    <th scope="col" class="z-10 sticky border-b border-gray-300 top-0 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">Serial</th>
                    <th scope="col" class="z-10 sticky border-b border-gray-300 top-0 py-3.5 pl-3 pr-4 sm:pr-6 backdrop-blur backdrop-filter">
                      <span class="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr v-for="node in nodes" :key="node.serial" :class="[selectedNodes.includes(node.serial) && 'bg-gray-50']">
                    <td class="relative w-12 px-6 sm:w-16 sm:px-8">
                      <div v-if="selectedNodes.includes(node.id)" class="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>
                      <input type="checkbox" class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6" :value="node.serial" v-model="selectedNodes" />
                    </td>
                  <td :class="['whitespace-nowrap py-4 pr-3 text-sm font-medium', selectedNodes.includes(node.serial) ? 'text-indigo-600' : 'text-gray-900']">
                    <DisplayNodeModal :node="node">{{ node.ipmiIP }}</DisplayNodeModal>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ node.serial }}
                  </td>
                  <td class="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <a href="#" class="text-indigo-600 hover:text-indigo-900"
                      >Edit<span class="sr-only">, {{ node.ipmiIP }}</span></a
                    >
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
</template>
