<script setup>
import AppLink from '@/components/Core/AppLink.vue'
import useNodes from '@/composables/useNodes.js'

const { ingestingNodes, getIngestingNodes, nodes, getNodes } = useNodes()

getIngestingNodes()
getNodes()

</script>

<template>
  <div>
    <div class="hidden sm:block">
      <div class="border-b border-gray-200 -mb-px mt-8 flex items-center justify-center gap-4">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <AppLink :to="{name: 'nodes.nodes'}" class="whitespace-nowrap inline-flex py-4 px-1 border-b-2 font-medium text-sm gap-2" exact-active-class="border-indigo-500 text-indigo-600" inactive-class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200">
            <span>Nodes</span>
            <span class="hidden bg-gray-100 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">{{ nodes.length }}</span>
          </AppLink>
          <AppLink :to="{name: 'nodes.ingesting'}" class="whitespace-nowrap inline-flex py-4 px-1 border-b-2 font-medium text-sm gap-2" exact-active-class="border-indigo-500 text-indigo-600" inactive-class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200">
            <span>Ingesting</span>
            <span class="hidden bg-gray-100 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">{{ ingestingNodes.length }}</span>
          </AppLink>
        </nav>
      </div>
    </div>
  </div>
  <div>
    <router-view></router-view>
  </div>

</template>
