<template>
  <v-dialog v-model="modelValue" max-width="400">
    <v-card class="add-element-modal">
      <h6 class="text-h6">{{ modalHeader }}</h6>
      <v-select
        label="Element type"
        :items="elementTypes"
        :disabled="!!$props.element"
        v-model="elementType"
      />
      <template v-if="elementType === 'Node'">
        <v-text-field
          label="Name"
          v-model="name"
          :error="isNameAlreadyTaken"
          :error-messages="isNameAlreadyTaken ? 'Name is already taken' : null"
        />
        <v-select label="Type" :items="nodeTypes" v-model="type" />
        <v-card-text>{{ nodeInfo }}</v-card-text>
      </template>
      <template v-if="elementType === 'Connection'">
        <v-text-field
          label="Source node name"
          v-model="sourceNodeName"
          :error="isSourceNodeNotFound"
          :error-messages="isSourceNodeNotFound ? 'Node not found' : null"
        />
        <v-text-field
          label="Target node name"
          v-model="targetNodeName"
          :error="isTargetNodeInputInErrorState"
          :error-messages="targetNodeErrorMessage"
        />
      </template>
      <div class="add-element-modal__controls">
        <v-btn
          :disabled="isAddElementButtonDisabled"
          :loading="areControlsLoading"
          @click="addElement"
        >
          {{ primaryButtonCaption }}
        </v-btn>
        <v-btn
          v-if="!!$props.element"
          :loading="areControlsLoading"
          @click="deleteElement"
        >
          Delete
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
//irl I would`ve separated this component into 3, where node and connection logic would be in child components
//but in current setup component doesn`t look that big and unreadable
import { computed, ref, watch } from "vue";
import {
  NodeAppearance,
  NodeConnectionAppearance,
  NodeConnectionAppearanceWithNodes,
  NodeType,
} from "@/stores/graph-data";
import { useGraphDataStore } from "@/stores/graph-data";
import { ErrorCodes } from "@/utils-types";

const modelValue = defineModel<boolean>();
const props = defineProps<{
  element: NodeAppearance | NodeConnectionAppearance | null;
}>();
//It is a common pattern to create a computed isUpdateState and refer to it to understand situation, but I don`t like to create to many "explanatory" entities
const modalHeader = computed(() =>
  props.element
    ? "name" in props.element
      ? `${props.element.type} ${props.element.name}`
      : `Excisting connection`
    : "Adding new element"
);
const primaryButtonCaption = computed(() => (props.element ? "Update" : "Add"));

const connetionNodes = ref<NodeConnectionAppearanceWithNodes | null>(null);
watch(modelValue, (val) => {
  if (!val) {
    name.value = null;
    type.value = null;
    elementType.value = "Node";
    sourceNodeName.value = null;
    targetNodeName.value = null;
  } else if (props.element) {
    if ("name" in props.element) {
      elementType.value = "Node";
      name.value = props.element.name;
      type.value = props.element.type;
    } else {
      elementType.value = "Connection";
      connetionNodes.value = graphDataStore.getNodesFromConnection(
        props.element
      );
      targetNodeName.value = connetionNodes.value.target.name;
      sourceNodeName.value = connetionNodes.value.source.name;
    }
  }
});

const elementTypes = ["Node", "Connection"];
const elementType = ref<string | null>("Node");

const graphDataStore = useGraphDataStore();
const nodeTypes = [NodeType.Computer, NodeType.Router, NodeType.Switch];
const name = ref<string | null>(null);
const type = ref<NodeType | null>(null);
const isNameAlreadyTaken = ref(false);
const addOrUpdateNode = async () => {
  if (!name.value || !type.value) {
    //unfortunately, ts doesn`t understand isAddElementButtonDisabled check, so it requires direct fields check
    return;
  }
  try {
    isNameAlreadyTaken.value = false;
    if (props.element) {
      await graphDataStore.updateNode({
        uuid: props.element.uuid,
        name: name.value.trim(),
        type: type.value,
      });
    } else {
      await graphDataStore.addNode({
        name: name.value.trim(),
        type: type.value,
      });
    }
    modelValue.value = false;
  } catch (e: any) {
    if ("code" in e && e.code === ErrorCodes.NAME_TAKEN) {
      isNameAlreadyTaken.value = true;
    }
  }
};
const nodeInfo = computed(() => {
  if (!props.element || "source" in props.element) {
    return null;
  }
  const nodes = graphDataStore.getConnectedNodesForNode(props.element);
  return `Incoming connections: ${
    nodes.incoming.length
      ? nodes.incoming.map((node) => node.name).join(",")
      : "none"
  }, outcoming connections: ${
    nodes.outcoming.length
      ? nodes.outcoming.map((node) => node.name).join(",")
      : "none"
  }`;
});

const sourceNodeName = ref<string | null>(null);
const targetNodeName = ref<string | null>(null);
const isSourceNodeNotFound = ref(false);
const isTargetNodeNotFound = ref(false);
const areNodesIdentical = ref(false);
const isConnectionAlreadyExists = ref(false);
const isTargetNodeInputInErrorState = computed<boolean>(
  () =>
    isTargetNodeNotFound.value ||
    areNodesIdentical.value ||
    isConnectionAlreadyExists.value
);
const targetNodeErrorMessage = computed<string | null>(() =>
  isTargetNodeNotFound.value
    ? "Node not found"
    : areNodesIdentical.value
    ? "Can`t create circular connection"
    : isConnectionAlreadyExists.value
    ? "Connection already exists"
    : null
);

//it`s sometimes hard to say, what is overkil andd what not,
//but I have a simple rule - if I made a mistake in some boolean computed, it should be destructurized
//I`m sure that this check could be done through vuetify validation, but it`s 8 in the evening and i want to finish it soon :)
const isNodeInputsFilled = computed(
  () => elementType.value === "Node" && (!name.value?.trim() || !type.value)
);
const isConnectionInputsFilled = computed(
  () =>
    elementType.value === "Connection" &&
    (!targetNodeName.value?.trim() || !sourceNodeName.value?.trim())
);
const isDataForUpdateFilled = computed(
  () =>
    !!props.element &&
    "name" in props.element &&
    (props.element.name === name.value ||
      props.element.type === type.value ||
      connetionNodes.value?.target.name === targetNodeName.value ||
      connetionNodes.value?.source.name === sourceNodeName.value)
);
const isAddElementButtonDisabled = computed<boolean>(
  () =>
    isNodeInputsFilled.value ||
    isDataForUpdateFilled.value ||
    isConnectionInputsFilled.value
);

const addOrUpdateConnection = async () => {
  if (!targetNodeName.value || !sourceNodeName.value) {
    //unfortunately, ts doesn`t understand isAddElementButtonDisabled check, so it requires direct fields check
    return;
  }
  try {
    isSourceNodeNotFound.value = false;
    isTargetNodeNotFound.value = false;
    if (props.element) {
      await graphDataStore.updateConnection({
        uuid: props.element.uuid,
        targetNodeName: targetNodeName.value.trim(),
        sourceNodeName: sourceNodeName.value.trim(),
      });
    } else {
      await graphDataStore.addConnection({
        targetNodeName: targetNodeName.value.trim(),
        sourceNodeName: sourceNodeName.value.trim(),
      });
    }
    modelValue.value = false;
  } catch (e: any) {
    if ("code" in e) {
      switch (e.code) {
        case ErrorCodes.TARGET_NODE_NOT_FOUND:
          isTargetNodeNotFound.value = true;
          return;
        case ErrorCodes.SOURCE_NODE_NOT_FOUND:
          isSourceNodeNotFound.value = true;
          return;
        case ErrorCodes.CONNECTION_ALREADY_EXISTS:
          isConnectionAlreadyExists.value = true;
          return;
      }
    }
  }
};

const areControlsLoading = computed(
  () =>
    graphDataStore.isAddConnectionLoading ||
    graphDataStore.isAddNodeLoading ||
    graphDataStore.isDeleteNodeLoading ||
    graphDataStore.isDeleteConnectionLoading ||
    graphDataStore.isUpdateConnectionLoading ||
    graphDataStore.isUpdateNodeLoading
);

const deleteNode = async () => {
  if (!props.element) {
    console.error("Tech error: node for deletion not found");
    return;
  }
  try {
    await graphDataStore.deleteNode(props.element.uuid);
    modelValue.value = false;
  } catch (e) {
    console.error(e);
  }
};

const deleteConnection = async () => {
  if (!props.element) {
    console.error("Tech error: connection for deletion not found");
    return;
  }
  try {
    await graphDataStore.deleteConnection(props.element.uuid);
    modelValue.value = false;
  } catch (e) {
    console.error(e);
  }
};

const addElement = async () =>
  elementType.value === "Node" ? addOrUpdateNode() : addOrUpdateConnection();

const deleteElement = async () =>
  elementType.value === "Node" ? deleteNode() : deleteConnection();
</script>

<style lang="css">
.v-card.add-element-modal {
  padding: 20px;
}

.add-element-modal__controls {
  display: flex;
  justify-content: space-between;
}
</style>
