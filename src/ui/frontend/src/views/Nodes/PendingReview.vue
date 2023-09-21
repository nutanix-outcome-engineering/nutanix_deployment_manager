<script setup>
import { ref, computed } from 'vue'
import { TrashIcon, ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import { startCase, range } from 'lodash'
import { AgGridVue as AgGrid } from '@ag-grid-community/vue3'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import '@ag-grid-community/styles/ag-grid.css'
import '@ag-grid-community/styles/ag-theme-alpine.css'

import useNodes from '@/composables/useNodes.js'
import { cellTypes } from '@/components/Grid/columnTypes.js'
import ValidatedCellRenderer from '@/components/Grid/ValidatedCellRenderer.vue';
import DisplayNodeDrawer from './DisplayNodeDrawer.vue';
import Button from '@/components/Core/Button.vue'


ModuleRegistry.registerModules([ClientSideRowModelModule])

const {
  ingestingNodes,
  isLoading,
  deleteIngestionTasks,
  addNodes,
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
    valueFormatter: ({value}) => {
      return startCase(value)
    },
    pinned: 'left',
    sort: 'asc',
    sortIndex: 2
  },
  {//TODO: Subnet mask as CIDR
    headerName: 'IPMI',
    children: [
      { headerName: 'Hostname', field: 'ipmi.hostname', cellDataType: 'hostname' },
      { headerName: 'IP', field: 'ipmi.ip', cellDataType: 'ip', columnGroupShow: 'open' },
      { headerName: 'Gateway', field: 'ipmi.gateway', cellDataType: 'gateway', columnGroupShow: 'open' },
      { headerName: 'Subnet Mask', field: 'ipmi.subnet', cellDataType: 'subnetMask', columnGroupShow: 'open' },
    ]
  },
  {
    headerName: 'Host',
    children: [
      { headerName: 'Hostname', field: 'host.hostname', cellDataType: 'hostname' },
      { headerName: 'IP', field: 'host.ip', cellDataType: 'ip', columnGroupShow: 'open' },
      { headerName: 'Gateway', field: 'host.gateway', cellDataType: 'gateway', columnGroupShow: 'open' },
      { headerName: 'Subnet Mask', field: 'host.subnet', cellDataType: 'subnetMask', columnGroupShow: 'open' }
    ]
  },
  {
    headerName: 'CVM',
    children: [
      { headerName: 'Hostname', field: 'cvm.hostname', cellDataType: 'hostname' },
      { headerName: 'IP', field: 'cvm.ip', cellDataType: 'ip', columnGroupShow: 'open' },
      { headerName: 'Gateway', field: 'cvm.gateway', cellDataType: 'gateway', columnGroupShow: 'open' },
      { headerName: 'Subnet Mask', field: 'cvm.subnet', cellDataType: 'subnetMask', columnGroupShow: 'open' },
    ]
  },
  {
    headerName: 'NIC Info',
    children: [
      {
        headerName: '',
        maxWidth: 100,
        valueGetter: ({data}) => { return data.ingestState },
        cellRenderer: ValidatedCellRenderer,
        cellDataType: 'text'
      },
      {
        headerName: 'Details',
        field: 'nicInfo',
        cellDataType: 'text',
        wrapText: true,
        autoHeight: true,
        cellRenderer: ({value}) => {
          if (value) {
            let retVal = []
            value.forEach(nic => {
              retVal.push(`${nic.name} ${nic.linkState} ${nic.switchInfo?.switchName} ${nic.switchInfo?.portID}`)
            })
            return retVal.join('<br>')
          } else {
            return undefined
          }
        },
        columnGroupShow: 'open'
      }
    ]
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


function addSelected() {
  let selected = gridAPI.value.getSelectedRows()
  addNodes(selected)
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
      <Button @click="addSelected" :disabled="isLoading" kind="secondary">
        <PaperAirplaneIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
        <span>Add Selected</span>
      </Button>
    </div>
    <AgGrid class="ag-theme-alpine w-full h-full"
      :columnDefs="columns" :rowData="ingestingNodes.filter(node => node.ingestState == 'pendingReview')"
      :gridOptions="gridOptions"
      @grid-ready="onGridReady"
      @rowClicked="onRowClicked"
    />
  </div>
</template>
