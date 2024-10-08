<script setup>
import { ref, computed } from 'vue'
import { ChevronDownIcon, ArrowPathIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { startCase, range } from 'lodash'
import { AgGridVue as AgGrid } from '@ag-grid-community/vue3'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import '@ag-grid-community/styles/ag-grid.css'
import '@ag-grid-community/styles/ag-theme-alpine.css'

import useNodes from '@/composables/useNodes.js'
import { cellTypes } from '@/components/Grid/columnTypes.js'
import DisplayNodeDrawer from './DisplayNodeDrawer.vue';
import Button from '@/components/Core/Button.vue'


ModuleRegistry.registerModules([ClientSideRowModelModule])

const { getIngestingNodes,
  ingestingNodes,
  isLoading,
  ingestIPRange,
  addNodes,
  deleteIngestionTasks,
  retryDiscovery
} = useNodes()
const gridAPI = ref(null)
const columnAPI = ref(null)
const nodeToDisplay = ref(null)
const displayNodeDetails = ref(false)

const columns = ref([
  {
    headerName: 'Block Serial',
    cellDataType: 'text',
    field: 'chassisSerial',
    pinned: 'left',
    headerCheckboxSelection: true,
    checkboxSelection: true,
    sort: 'asc',
    sortIndex: 1
  },
  {
    headerName: 'Node Serial',
    cellDataType: 'text',
    field: 'serial',
    pinned: 'left',
  },
  {
    headerName: 'Ingest Status',
    cellDataType: 'text',
    minWidth: 75,
    field: 'ingestState',
    pinned: 'left',
    valueFormatter: ({value, data}) => {
      let stats = data.taskData?.statistics
      let retVal = `${startCase(value)}`
      // Maybe do Step x of y
      if (stats) {
        retVal += ` (${stats.completedTasks / stats.totalTasks * 100}%) Step ${Math.min(stats.completedTasks + 1, stats.totalTasks)} of ${stats.totalTasks}`
      } else if (value == 'pending') {
        retVal += ' (0%)'
      }
      return retVal
    },
    sort: 'asc',
    sortIndex: 1
  },
  {
    headerName: 'Failure Reason',
    cellDataType: 'text',
    field: 'failureReason',
    flex: 2
  }
])

const gridOptions = {
  rowSelection: 'multiple',
  rowMultiSelectWithClick: true,
  editType: '',
  dataTypeDefinitions: cellTypes,
  multiSortKey: 'ctrl',
  autoSizePadding: 5,
  skipHeaderOnAutoSize: true,
  defaultColDef: {
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
  getRowId: ({data}) => data.id
}

async function onGridReady(params) {
  gridAPI.value = params.api
  columnAPI.value = params.columnApi
}

function onRowClicked({data}) {
  if (nodeToDisplay?.value?.id != data.id || (nodeToDisplay?.value?.id == data.id && !displayNodeDetails.value)) {
    displayNodeDetails.value = true
  } else if (nodeToDisplay?.value?.id == data.id) {
    displayNodeDetails.value = false
  }
  nodeToDisplay.value = data
}

function retrySelected() {
  let selected = gridAPI.value.getSelectedRows()
  retryDiscovery(selected.map(node => node.id))
}

function deleteSelected() {
  let selected = gridAPI.value.getSelectedRows()
  deleteIngestionTasks(selected.map(node => node.id))
}

</script>

<template>
  <div class="flex flex-1 flex-col">
    <div class="flex flex-1 flex-row">
      <Button @click="retrySelected" :disabled="isLoading" kind="secondary">
        <ArrowPathIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
        <span>Retry Selected</span>
      </Button>
      <Button @click="deleteSelected" :disabled="isLoading" kind="secondary">
        <TrashIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
        <span>Remove Selected</span>
      </Button>
    </div>
    <AgGrid class="ag-theme-alpine w-full h-full"
      :columnDefs="columns" :rowData="ingestingNodes.filter(node => node.ingestState != 'pendingReview')"
      :gridOptions="gridOptions"
      @grid-ready="onGridReady"
      @rowClicked="onRowClicked"
    />
  </div>
</template>
