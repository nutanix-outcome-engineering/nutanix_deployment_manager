<script setup>
import { computed, ref } from 'vue'
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem
} from '@headlessui/vue'
import {
  XCircleIcon,
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/solid'
import { AgGridVue as AgGrid } from '@ag-grid-community/vue3'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import '@ag-grid-community/styles/ag-grid.css'
import '@ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([ClientSideRowModelModule])

import Badge from '@/components/Core/Badge.vue'
import TextField from '@/components/Core/Form/TextField.vue'

import Button from '@/components/Core/Button.vue'
import useNodes from '@/composables/useNodes.js'
import { FilterBox, FilterQuery, FilterButton, ClearQueryButton, SuggestionList, Suggestion } from '@/components/Core/FilterBox.js'
import { cellTypes } from '@/components/Grid/columnTypes.js'
import NodeCellRenderer from '@/components/Grid/NodeCellRenderer.vue'
import CreateClusterSlideOver from '../Clusters/CreateClusterSlideOver.vue';

const { nodes } = useNodes()
const form = ref({
  search: '',
  filters: []
})
const filterables = [
  {label: 'Node Serial', field: 'serial', op: ['~'], mode: 'enum'},
  {label: 'Chassis Serial', field: 'chassisSerial', op: ['~'], mode: 'enum'},
  {
    label: 'Part of Cluster',
    field: 'clusterID',
    mode: 'custom',
    filters: [
      {
        suggestionLabel: 'Part of Cluster',
        label: 'Yes',
        field: 'clusterID',
        function: (item, value) => {
          return (Boolean(item.clusterID)) === true
        }
      },
      {
        suggestionLabel: 'Not Part of Cluster',
        label: 'No',
        field: 'clusterID',
        function: (item, value) => {
          return (Boolean(item.clusterID)) === false
        }
      }
    ]
  }
]
const gridAPI = ref(null)
const columnAPI = ref(null)
const numberSelected = ref(0)
const selectedNodes = ref([])

const currentPage = ref(0)
const totalPages = ref(0)
const currentPageSize = ref(0)
const paginationControlsDisabled = computed(() => {
  return totalPages.value === 1
})

const columns = ref([{
  headerName: 'Node',
  valueGetter: ({data}) => {return data},
  cellRenderer: NodeCellRenderer
}])

const gridOptions = {
  rowSelection: 'multiple',
  rowMultiSelectWithClick: true,
  editType: '',
  dataTypeDefinitions: cellTypes,
  multiSortKey: 'ctrl',
  autoSizePadding: 5,
  skipHeaderOnAutoSize: true,
  animateRows: true,
  pagination:true,
  paginationPageSize: 10,
  suppressPaginationPanel: true,
  defaultColDef: {
    autoHeight: true,
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: true,
    editable: false,
    flex: 1,
    cellDataType: 'text',
    cellClassRules: {
    }
  },
  getRowId: ({data}) => data.serial,
  isExternalFilterPresent: isExternalFilterPresent,
  isRowSelectable: ({data}) => data.clusterID == null,
  rowClassRules: {
    'cursor-not-allowed': ({data}) => data.clusterID != null
  }
}

async function onGridReady(params) {
  gridAPI.value = params.api
  columnAPI.value = params.columnApi
}

function isExternalFilterPresent() {
  return form.value.search.length || form.value.filters.length
}

function onFilterChanged(event) {
  if (gridAPI.value) {
    gridAPI.value.onFilterChanged()
    gridAPI.value.getSelectedNodes()
      .filter(row => row.displayed == false && row.isSelected())
      .forEach(row => row.setSelected(false))
  }
}

function onPaginationChange() {
  if (gridAPI.value) {
    currentPage.value = gridAPI.value.paginationGetCurrentPage() + 1
    totalPages.value = gridAPI.value.paginationGetTotalPages()
    currentPageSize.value = gridAPI.value.paginationGetPageSize()
  }
}

function pageSelectorChanged(newPage) {
  if (gridAPI.value) {
    let gotoPage = Math.min(Math.max(Number(newPage), 1), totalPages.value)
    gridAPI.value.paginationGoToPage(gotoPage - 1)
    currentPage.value = gotoPage
  }
}

function nodeSelectionChanged(event) {
  selectedNodes.value = gridAPI.value.getSelectedRows()
  numberSelected.value = selectedNodes.value.length
}

function clusterAdded(newCluster) {
  gridAPI.value.applyTransaction({update: newCluster.nodes})
  gridAPI.value.deselectAll()
}
</script>

<template>
<div class="flex flex-1 w-full">
  <FilterBox
    @filterChanged="onFilterChanged"
    v-model:filters="form.filters"
    :filterable="filterables"
    :items="nodes"
    v-slot="{ results, filters, suggestions, api }"
    class="flex flex-1 w-full"
  >
    <div class="flex flex-1 flex-col">
      <div class="flex flex-col relative">
        <div class="flex flex-row my-0.5">
          <div class="w-full px-3 py-1 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 border border-gray-300 rounded-md shadow-sm overflow-hidden">
            <div class="flex items-center">
              <ClearQueryButton class="-ml-1 mr-1" v-tippy content="Reset Filter">
                <XCircleIcon class="w-5 h-5 text-red-400"/>
              </ClearQueryButton>
              <div class="space-x-2 flex items-center">
                <FilterButton v-for="(filter, index) in filters" :key="index">
                  <Badge :label="filter.label.field" :color="filter.label.color">
                    <div class="flex items-center">
                      {{ filter.label.value }}
                      <XCircleIcon class="ml-2 -mr-1 w-4 h-4 text-gray-400" />
                    </div>
                  </Badge>
                </FilterButton>
              </div>
              <label for="filterInput" class="sr-only block text-sm font-medium text-gray-700">Filter Nodes</label>
              <FilterQuery as="input" id="filterInput" type="text" v-model="form.search" autocomplete="off" class="focus:ring-0 focus:outline-none border-none block w-full text-sm" placeholder="Filter" />
            </div>
          </div>
          <div class="flex flex-grow flex-row items-center text-sm px-2 space-x-2">
            <Menu as="div" class="mx-1 relative inline-block text-left bg-green-300">
              <MenuButton >
                <Button size="sm" kind="secondary" type="button">
                  Page Size<br>{{ currentPageSize==nodes.length ? 'All' : currentPageSize }}
                </Button>
              </MenuButton>
              <MenuItems class="absolute z-10 origin-center translate-x-[60%] items-center text-base px-1 py-1 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-10">
                <MenuItem as="div" class="rounded-md px-1 ui-active:bg-blue-200" @click="gridAPI.paginationSetPageSize(10)">10</MenuItem>
                <MenuItem as="div" class="rounded-md px-1 ui-active:bg-blue-200" @click="gridAPI.paginationSetPageSize(20)">20</MenuItem>
                <MenuItem as="div" class="rounded-md px-1 ui-active:bg-blue-200" @click="gridAPI.paginationSetPageSize(nodes.length)">All</MenuItem>
              </MenuItems>
            </Menu>
            <button :disabled="paginationControlsDisabled"
              :class="[paginationControlsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']"
              @click="gridAPI.paginationGoToFirstPage()"
            >
              <ChevronDoubleLeftIcon class="w-5 h-5"/>
            </button>
            <button :disabled="paginationControlsDisabled"
              :class="[paginationControlsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']"
              @click="gridAPI.paginationGoToPreviousPage()"
            >
              <ChevronLeftIcon class="w-5 h-5"/>
            </button>
            <span class="text-center items-center flex whitespace-nowrap">
              <label for="pageSelector" class="sr-only">Select page</label>
              <TextField id='pageSelector' type="number" class="-mt-1 w-16 mr-2"
                :debounce="Number(250)" v-model="currentPage"
                :disabled="totalPages == 1"
                :min="1" :max="totalPages"
                @update:modelValue="pageSelectorChanged" @focus="e => e.target.select()"
              />
              of {{ totalPages }}
            </span>
            <button :disabled="paginationControlsDisabled"
              :class="[paginationControlsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']"
              @click="gridAPI.paginationGoToNextPage()"
            >
              <ChevronRightIcon class="w-5 h-5"/>
            </button>
            <button :disabled="paginationControlsDisabled"
              :class="[paginationControlsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']"
              @click="gridAPI.paginationGoToLastPage()"
            >
              <ChevronDoubleRightIcon class="w-5 h-5"/>
            </button>
            <CreateClusterSlideOver :nodes="selectedNodes" @clusterAdded="clusterAdded">
              <template #activator="{ open }">
                <Button :disabled="numberSelected == 0" @click="open">
                  <Cog6ToothIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
                  Create Cluster
                </Button>
              </template>
            </CreateClusterSlideOver>
          </div>
        </div>
        <!-- Suggestions -->
        <div class="absolute top-10 mt-2.5 rounded-md shadow-lg border w-full" v-if="suggestions.length">
          <div class="rounded-md shadow-xs overflow-hidden">
            <div class="z-20 relative grid gap-4 bg-white px-5 py-6">
              <SuggestionList as="div" v-for="(suggestionList, listIndex) in suggestions" :key="listIndex">
                <h3 class="mb-1 font-medium text-sm text-gray-600">{{ suggestionList.label }}</h3>
                <div class="-mx-2 px-2">
                  <!-- Suggestion -->
                  <Suggestion as="button" v-for="(suggestion, index) in suggestionList.suggestions" :key="index" v-slot="{ isActive }" class="mb-2 mr-2 rounded-full focus:ring-2 focus:ring-blue-500">
                    <Badge :color="suggestion.filter.label.color">{{ suggestion.label }}</Badge>
                  </Suggestion>
                </div>
              </SuggestionList>
            </div>
          </div>
        </div>
        <!-- Suggestions END -->
      </div>
      <AgGrid class="ag-theme-alpine w-full h-full"
        :columnDefs="columns" :rowData="nodes"
        :gridOptions="gridOptions"
        @grid-ready="onGridReady"
        @pagination-changed="onPaginationChange"
        @selection-changed="nodeSelectionChanged"
        :doesExternalFilterPass="(rowNode) => {return api.doesItemMatchFilter(rowNode.data)}"
      />

    </div>
  </FilterBox>
</div>
</template>

<style scoped>
:deep(.ag-header ) {
  display: none;
}
</style>
