<script setup>
import { ref } from 'vue'
import { ChevronDownIcon, ArrowPathIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import { ip2long, long2ip } from 'netmask'
import { AgGridVue as AgGrid } from '@ag-grid-community/vue3'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import '@ag-grid-community/styles/ag-grid.css'
import '@ag-grid-community/styles/ag-theme-alpine.css'
import { get } from 'lodash'


import { cellTypes } from '@/components/Grid/columnTypes.js'
import Button from '@/components/Core/Button.vue'
import useNodes from '@/composables/useNodes.js'
import IngestNodesModal from '@/views/Nodes/IngestNodesModal.vue';

ModuleRegistry.registerModules([ClientSideRowModelModule])

const {
  foundationDiscoverNodes,
  foundationReconfigureNodes,
  discoveredNodes,
  isLoading,
  ingestIPRange,
  ingestDiscovery,
  fetchAll,
  ingestingNodes,
  nodes,
  allNodes
 } = useNodes()


const columns = ref([
  {
    headerName: 'Block Serial',
    cellDataType: 'text',
    field: 'chassisSerial',
    pinned: 'left',
    headerCheckboxSelection: true,
    headerCheckboxSelectionFilteredOnly: true,
    checkboxSelection: true,
    editable: false,
    sort: 'asc',
    sortIndex: 1
  },
  {
    headerName: 'Node Serial',
    cellDataType: 'text',
    field: 'serial',
    pinned: 'left',
    editable: false,
  },
  {
    headerName: 'Position',
    cellDataType: 'text',
    minWidth: 75,
    field: 'position',
    suppressMenu: true,
    pinned: 'left',
    sort: 'asc',
    sortIndex: 2
  },
  {
    headerName: 'Model',
    cellDataType: 'text',
    field: 'model',
    hide: true,
    suppressMenu: true,
    pinned: 'left'
  },
  {//TODO: Subnet mask as CIDR
    headerName: 'IPMI',
    children: [
      { headerName: 'IP', field: 'ipmi.ip', editable: true, cellDataType: 'ip' },
      { headerName: 'Gateway', field: 'ipmi.gateway', editable: true, cellDataType: 'gateway' },
      { headerName: 'Subnet Mask', field: 'ipmi.subnet', editable: true, cellDataType: 'subnetMask' },
    ]
  },
  {
    headerName: 'Host',
    children: [
      { headerName: 'Hostname', field: 'host.hostname', editable: true, cellDataType: 'hostname' },
      { headerName: 'IP', field: 'host.ip', editable: true, cellDataType: 'ip' },
      { headerName: 'Gateway', field: 'host.gateway', editable: true, cellDataType: 'gateway' },
      { headerName: 'Subnet Mask', field: 'host.subnet', editable: true, cellDataType: 'subnetMask' }
    ]
  },
  {
    headerName: 'CVM',
    children: [
      { headerName: 'IP', field: 'cvm.ip', editable: true, cellDataType: 'ip' },
      { headerName: 'Gateway', field: 'cvm.gateway', editable: true, cellDataType: 'gateway' },
      { headerName: 'Subnet Mask', field: 'cvm.subnet', editable: true, cellDataType: 'subnetMask' },
    ]
  },
])

const editForm = {}
const selectedRows = ref([])
const editing = ref(false)
const gridAPI = ref(null)
const columnAPI = ref(null)
const duplicates = ref([])
const gridOptions = {
  rowSelection: 'multiple',
  rowMultiSelectWithClick: true,
  editType: '',
  pinnedTopRowData: [editForm],
  dataTypeDefinitions: cellTypes,
  multiSortKey: 'ctrl',
  autoSizePadding: 5,
  skipHeaderOnAutoSize: true,
  defaultColDef: {
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: true,
    flex: 1,
    cellDataType: 'text',
    cellClassRules: {
      'bg-gray-100': params => !params.colDef.editable,
      'text-gray-500 italic': params => params.node.rowPinned,
      'border-2 border-red-700 bg-red-200': params => {
        return duplicates.value.includes(params.value) && !params.node.rowPinned
      }
    },
    valueFormatter: (params) => {
      let isEmptyPinnedCell = (
        (params.node.rowPinned === 'top' && params.value == null) ||
        (params.node.rowPinned === 'top' && params.value === '')
      )

      return isEmptyPinnedCell ? rangeFillPlaceHolder(params) : undefined
    }
  },
  isExternalFilterPresent: () => { return true },
  doesExternalFilterPass: externalFilterFunction,
  isRowSelectable: (rowNode) => !isNodeInSystem(rowNode),
  getRowId: ({data}) => `${data.chassisSerial}:${data.serial}`
}

function rangeFillPlaceHolder({ colDef, node }) {
  let placeholder = undefined
  switch (colDef.cellDataType) {
    case 'ip':
      placeholder = '10.8.2.1 [\u00B14]'
    break;
    case 'gateway':
      placeholder = 'Gateway'
    break;
    case 'subnetMask':
      placeholder = 'Subnet Mask'
    break;
    case 'hostname':
      // matches = newValue.match(/(?<name>[\w-]+\D)(?<suffix>\d*)$/).groups
      placeholder = 'Hostname'
    break;
  }
  if (node.rowPinned === 'top' && colDef.field === 'chassisSerial') {
    placeholder = 'Select nodes to range fill: '
  }

  return placeholder
}

function findDuplicates() {
  let columnsToCheck = ['ipmi.ip', 'cvm.ip', 'host.hostname', 'host.ip']
  let seen = new Set()
  duplicates.value = []
  gridAPI.value.forEachNode(rowNode => {
    for (let column of columnsToCheck) {
      let value = get(rowNode.data, column)
      if (seen.has(value)) {
        duplicates.value.push(value)
      }
      seen.add(value)
    }
  })
}

function externalFilterFunction(rowNode) {
  let retVal = false
  retVal ||= !isNodeInSystem(rowNode)

  return retVal
}

function onCellEditingStopped(params) {
  if (params.rowPinned == 'top') {
    if (params.valueChanged) {
      let column = params.column
      let selectedRows = getSortedSelectedNodes()
      let newValue = params.newValue
      let matches
      switch (params.colDef.cellDataType) {
        case 'ip':
          matches = newValue.match(/(?<ip>.*\S)[ ]*(?<incrementor>[+-]\d+)/)?.groups
          let newIP
          let incrementor = 1
          if (matches) {
            newIP = ip2long(matches.ip)
            incrementor = Number(matches.incrementor)
          } else {
            newIP = ip2long(newValue)
          }
          selectedRows.forEach(rowNode => {
            rowNode.setDataValue(column, long2ip(newIP), 'cellUpdatePatternFill')
            newIP += incrementor
          })
        break;
        case 'gateway':
        case 'subnetMask':
          selectedRows.forEach(rowNode => {
            rowNode.setDataValue(column, newValue, 'cellUpdatePatternFill')
          })
        break;
        case 'hostname':
          matches = newValue.match(/(?<name>[\w-]+\D)(?<suffix>\d*)$/).groups
          let newName = matches.name
          // Preserve suffix padding
          let newSuffix = Number(matches.suffix || 1)
          let padLength = Math.max(String(newSuffix + selectedRows.length).length, matches.suffix.length)

          selectedRows.forEach(rowNode => {
            rowNode.setDataValue(column, `${newName}${newSuffix.toString().padStart(padLength, '0')}`, 'cellUpdatePatternFill')
            newSuffix++
          })
        break;
      }
    }
  }
}

function getSortedSelectedNodes() {
  let selectedRows = []
  gridAPI.value.forEachNodeAfterFilterAndSort((rowNode) => {
    if (rowNode.isSelected()) {
      selectedRows.push(rowNode)
    }
  })
  return selectedRows
}

function isNodeInSystem(rowNode) {
  let nodeInSystem = Boolean(allNodes.value.find(node => {
    return node.serial == rowNode.data.serial
  }))
  return nodeInSystem
}

function cellValueChange(item) {
  if (item.node.rowIndex) {
    item.node.setSelected(true)
  }
  findDuplicates()
  gridAPI.value.refreshCells()
}

function selectionChanged(event) {
  selectedRows.value = gridAPI.value.getSelectedRows()
}

async function onGridReady(params) {
  gridAPI.value = params.api
  columnAPI.value = params.columnApi

  refresh(true)
}

function autoSizeColumns(params) {
  params.columnApi.autoSizeAllColumns()
}

async function refresh(skipDiscover) {
  if (!skipDiscover) {
    gridAPI.value.showLoadingOverlay()
    await foundationDiscoverNodes()
  }
  await fetchAll()
  findDuplicates()
  // Deselect all Nodes in system. This is to filter out nodes we just started
  // ingesting without trigering a discover nodes call.
  gridAPI.value.getSelectedNodes().forEach(rowNode => {
    if (isNodeInSystem(rowNode)) {
      rowNode.setSelected(false)
    }
  })
  // Reset vue state of selected nodes after we've deselected nodesInSystem
  selectedRows.value = gridAPI.value.getSelectedRows()
  gridAPI.value.refreshCells()
  gridAPI.value.onFilterChanged()
}

function update() {
  let selected = gridAPI.value.getSelectedRows()
  gridAPI.value.showLoadingOverlay()
  foundationReconfigureNodes(selected)
}

async function ingestDiscoveryWrapper(data) {
  await ingestDiscovery(data)
  refresh(true)
}
</script>

<template>
  <div class="flex flex-w flex-row">
    <Button @click="refresh(false)" :disabled="isLoading" kind="secondary">
      <ArrowPathIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
      <span>Re-Discover</span>
    </Button>
    <Button @click="update" :disabled="isLoading || duplicates.length > 0" kind="secondary">
      <PencilSquareIcon class="-ml-2 mr-2 w-5 h-5 shrink-0"/>
      <span>Update</span>
    </Button>
    <IngestNodesModal :disabled="isLoading || duplicates.length > 0" :nodes="selectedRows" @ingestByDiscovery="ingestDiscoveryWrapper" @ingestByRange="ingestIPRange"/>
  </div>
  <AgGrid class="ag-theme-alpine w-full h-full"
    :columnDefs="columns" :rowData="discoveredNodes"
    :gridOptions="gridOptions"
    @grid-ready="onGridReady"
    @cellValueChanged="cellValueChange"
    @selectionChanged="selectionChanged"
    @cellEditingStopped="onCellEditingStopped"
    @firstDataRendered="autoSizeColumns"
    @modelUpdated="autoSizeColumns"
  />
</template>
