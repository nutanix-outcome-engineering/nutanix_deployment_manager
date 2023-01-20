<template>
      <div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div class="px-4 sm:px-6 lg:px-8">
          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <h1 class="text-xl font-semibold text-gray-900">Cluster Import</h1>
              <p class="mt-2 text-sm text-gray-700">A list of all the Clusters currently pending addition.</p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button type="button" class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto">Import CSV</button>
            </div>
          </div>
          <div class="mt-8 flex flex-col max-h-[600px] overflow-y-auto">
            <div class="-my-2 -mx-4 sm:-mx-6 lg:-mx-8">
              <div class="inline-block min-w-full py-2 align-middle">
                <div class="shadow-sm ring-1 ring-black ring-opacity-5">
                  <table class="min-w-full border-separate" style="border-spacing: 0">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8">Name</th>
                        <th scope="col" class="sticky top-0 z-10 hidden border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell">Model</th>
                        <th scope="col" class="sticky top-0 z-10 hidden border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell">Serial</th>
                        <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">idracIP</th>
                        <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">Status</th>
                        <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 py-3.5 pr-4 pl-3 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8">
                          <span class="sr-only">Edit</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white">
                      <tr v-for="(cluster, clusterIdx) in clusters" :key="cluster.email">
                        <td :class="[clusterIdx !== clusters.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8']">{{ cluster.name }}</td>
                        <td :class="[clusterIdx !== clusters.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell']">{{ cluster.model }}</td>
                        <td :class="[clusterIdx !== clusters.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden lg:table-cell']">{{ cluster.servicetag }}</td>
                        <td :class="[clusterIdx !== clusters.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">{{ cluster.idracip }}</td>
                        <td :class="[clusterIdx !== clusters.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">
                          <span :class="cluster.status == 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-red-200  text-red-700'" class="inline-flex rounded-full px-2 text-xs font-semibold leading-5">{{cluster.status}}</span>
                        </td>
                        <td :class="[clusterIdx !== clusters.length - 1 ? 'border-b border-gray-200' : '', 'relative whitespace-nowrap py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-6 lg:pr-8']">
                          <a href="#" class="text-indigo-600 hover:text-indigo-900"
                            >Edit<span class="sr-only">, {{ cluster.name }}</span></a
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

<script setup>
const clusters = [
  { name: 'Cluster FlooplDorf', model: 'DX9000', servicetag: 'DB1F6S3', idracip: '10.42.199.10', status: "Healthy" },
  { name: 'Cluster BobbyDole', model: 'DX9000', servicetag: 'DB1F6S4', idracip: '10.42.199.11', status: "Healthy" },
  { name: 'Cluster HurrglShmurrg', model: 'DX9000', servicetag: 'DB1F6S5', idracip: '10.42.199.12', status: "Healthy" },
  { name: 'Cluster AngryGing', model: 'DX9000', servicetag: 'DB1F6S6', idracip: '10.42.199.13', status: "Healthy" },
  { name: 'Cluster OffensiveLanguage', model: 'DX9000', servicetag: 'DB1F6S7', idracip: '10.42.199.14', status: "Healthy" },
  { name: 'Cluster DrunkOnBeers', model: 'DX9000', servicetag: 'DB1F6S8', idracip: '10.42.199.15', status: "Healthy" },
  { name: 'Cluster RunningOut', model: 'DX9000', servicetag: 'DB1F6S9', idracip: '10.42.199.16', status: "Healthy" },
  { name: 'Cluster OfFunnyNames', model: 'DX9000', servicetag: 'DB1F6T0', idracip: '10.42.199.17', status: "Healthy" },
  { name: 'Cluster JustWantTo', model: 'DX9000', servicetag: 'DB1F6T1', idracip: '10.42.199.18', status: "Healthy" },
  { name: 'Cluster GetItPast', model: 'DX9000', servicetag: 'DB1F6T2', idracip: '10.42.199.19', status: "Healthy" },
  { name: 'Cluster OnePageSo', model: 'DX9000', servicetag: 'DB1F6T3', idracip: '10.42.199.20', status: "Healthy" },
  { name: 'Cluster ICanSeeThe', model: 'DX9000', servicetag: 'DB1F6T4', idracip: '10.42.199.21', status: "Healthy" },
  { name: 'Cluster StickyHeaders', model: 'DX9000', servicetag: 'DB1F6T5', idracip: '10.42.199.22', status: "Healthy" },
  { name: 'Cluster CmonBro', model: 'DX9000', servicetag: 'DB1F6T6', idracip: '10.42.199.23', status: "Healthy" },
  { name: 'Cluster GettinSilly', model: 'DX9000', servicetag: 'DB1F6T7', idracip: '10.42.199.24', status: "Healthy" },
  { name: 'Cluster SlapAGoat', model: 'DX9000', servicetag: 'DB1F6T8', idracip: '10.42.199.25', status: "Healthy" },
  { name: 'Cluster DrinkABeer', model: 'DX9000', servicetag: 'DB1F6T9', idracip: '10.42.199.26', status: "Healthy" },
  { name: 'Cluster DoADance', model: 'DX9000', servicetag: 'DB1F6U0', idracip: '10.42.199.27', status: "Healthy" },
  { name: 'Cluster MakeSomeLove', model: 'DX9000', servicetag: 'DB1F6U1', idracip: '10.42.199.28', status: "Not" },
  { name: 'Cluster GetDownTonight', model: 'DX9000', servicetag: 'DB1F6U2', idracip: '10.42.199.29', status: "Healthy" }
  // More clusters...
]
</script>
