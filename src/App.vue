<template>
  <v-app theme="light">
    <v-main>
      <v-icon
        v-if="graphDataStore.isGraphDataLoading"
        class="loader-icon"
        icon="mdi-reload"
        size="x-large"
      />
      <transition name="fade">
        <div
          v-show="!graphDataStore.isGraphDataLoading"
          class="bulat-test__content"
        >
          <v-network-graph
            class="graph"
            :nodes="graphDataStore.nodes"
            :edges="graphDataStore.connections"
            :event-handlers="eventHandlers"
            :configs="configs"
          />
          <div class="bulat-test__controls">
            <v-btn @click="updateIsAddElementModalVisible(true)">
              Add element
            </v-btn>
          </div>
        </div>
      </transition>
    </v-main>
    <add-element-modal
      :model-value="isAddElementModalVisible"
      :element="elementForModal"
      @update:model-value="updateIsAddElementModalVisible"
    />
  </v-app>
</template>

<script setup lang="ts">
import { onBeforeMount, onUnmounted, ref } from "vue";
import * as vNG from "v-network-graph";
import {
  NodeAppearance,
  NodeConnectionAppearance,
  useGraphDataStore,
} from "@/stores/graph-data";
import AddElementModal from "@/components/add-element-modal.vue";

const graphDataStore = useGraphDataStore();
onBeforeMount(graphDataStore.fetchGraphData);
onUnmounted(graphDataStore.$dispose);

const configs = ref(
  vNG.defineConfigs<vNG.Node, vNG.Edge>({
    node: {
      normal: {
        type: "circle",
        radius: (node) => node.size, // Use the value of each node object
        color: (node) => node.color,
      },
      hover: {
        radius: (node) => node.size + 2,
        color: (node) => node.color,
      },
      selectable: true,
    },
    edge: {
      selectable: true,
    },
  })
);

const elementForModal = ref<NodeAppearance | NodeConnectionAppearance | null>(
  null
);
const isAddElementModalVisible = ref(false);
const updateIsAddElementModalVisible = (val: boolean) => {
  if (!val) {
    elementForModal.value = null;
  }
  isAddElementModalVisible.value = val;
};
const eventHandlers: vNG.EventHandlers = {
  "node:select": ([nodeUuid]) => {
    if (!nodeUuid) {
      return;
    }
    elementForModal.value = graphDataStore.nodes[nodeUuid];
    isAddElementModalVisible.value = true;
  },
  "edge:select": ([connectionUuid]) => {
    if (!connectionUuid) {
      return;
    }
    elementForModal.value = graphDataStore.connections[connectionUuid];
    isAddElementModalVisible.value = true;
  },
};
</script>

<style lang="css">
html {
  overflow-y: auto;
}
body {
  margin: 0;
}

:deep(.fade-enter-active),
:deep(.fade-leave-active) {
  transition: opacity 0.4s ease-in-out;
}

:deep(.fade-enter-from),
:deep(.fade-leave-to) {
  opacity: 0;
}

.graph {
  height: 300px;
  border: 1px solid #000;
}

.loader-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-name: spin;
  animation-duration: 4000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.bulat-test__node {
  position: relative;
  height: 32px;
  width: 32px;
}

.delete-badge text {
  font-size: 14px;
  stroke: #fff;
  text-anchor: middle;
  dominant-baseline: middle;
  cursor: pointer;
}
</style>
