//It may look like this file has outgrown it`s readability limits, but it`s partially because of backend mock
//If even without mock file would look outgrown, I would either seperate types and logic or backend calls and logic
import { ref } from "vue";
import { defineStore } from "pinia";
import { ErrorCodes } from "@/utils-types";

export enum NodeType {
  Computer = "computer",
  Router = "router",
  Switch = "switch",
}

//I ignored v-network-graph types intentionally, becase they do not
//provide me with any speed boost or additional safety (you may look at Node and Edge types in the lib yourself)
export type Node = {
  uuid: string;
  name: string;
  type: NodeType;
};

export type NodeAppearanceParams = {
  color: string;
  size: number;
};

export type NodeAppearance = Node & NodeAppearanceParams;

//target and source intentionally come from api as fields with different names, as it often happens irl
export type NodeConnection = {
  uuid: string;
  sourceNodeUuid: string;
  targetNodeUuid: string;
};

export type NodeConnectionAppearance = {
  uuid: string;
  source: string;
  target: string;
};

export type NodeConnectionAppearanceWithNodes = Omit<
  NodeConnectionAppearance,
  "target" | "source"
> & {
  target: NodeAppearance;
  source: NodeAppearance;
};

export const useGraphDataStore = defineStore("graphData", () => {
  const nodes = ref<Record<string, NodeAppearance>>({});
  const connections = ref<Record<string, NodeConnectionAppearance>>({});
  //it is worth noting, that data-fetch-loading-error variables approach can become tedious with time, so i would like to implement TanStaskQuery in the project
  const isGraphDataLoading = ref(false);
  const fetchGraphData = async () => {
    try {
      isGraphDataLoading.value = true;
      const response = await new Promise<{
        nodes: Node[];
        connections: NodeConnection[];
      }>((res) =>
        setTimeout(
          () =>
            res({
              nodes: [
                { uuid: "0", name: "pc 1", type: NodeType.Computer },
                { uuid: "1", name: "pc 2", type: NodeType.Computer },
                { uuid: "2", name: "router 1", type: NodeType.Router },
              ],
              connections: [
                { uuid: "0", sourceNodeUuid: "0", targetNodeUuid: "2" },
                { uuid: "1", sourceNodeUuid: "1", targetNodeUuid: "2" },
              ],
            }),
          2000
        )
      );
      nodes.value = adaptNodesFromApi(response.nodes);
      connections.value = adaptConnectionsFromApi(response.connections);
    } catch (e) {
      //here should be function call for error toast, but this is test task :)
      console.error(e);
    } finally {
      isGraphDataLoading.value = false;
    }
  };

  const adaptConnectionsFromApi = (
    connections: NodeConnection[]
  ): Record<string, NodeConnectionAppearance> =>
    connections.reduce<Record<string, NodeConnectionAppearance>>(
      (acc, connection) => ({
        ...acc,
        [connection.uuid]: {
          uuid: connection.uuid,
          source: connection.sourceNodeUuid,
          target: connection.targetNodeUuid,
        },
      }),
      {}
    );

  const adaptNodesFromApi = (nodes: Node[]): Record<string, NodeAppearance> =>
    nodes.reduce<Record<string, NodeAppearance>>(
      (acc, node) => ({
        ...acc,
        [node.uuid]: {
          ...node,
          ...getNodeAppearanceFromType(node.type),
        },
      }),
      {}
    );

  const getNodeAppearanceFromType = (type: NodeType): NodeAppearanceParams => {
    switch (type) {
      case NodeType.Computer:
        return { color: "skyblue", size: 24 };
      case NodeType.Router:
        return { color: "hotpink", size: 32 };
      default:
        return { color: "gray", size: 16 };
    }
  };

  const isAddNodeLoading = ref(false);
  const addNode = async (payload: { name: string; type: NodeType }) => {
    try {
      isAddNodeLoading.value = true;
      await new Promise<void | { code: ErrorCodes }>((res, rej) =>
        setTimeout(() => {
          if (
            !Object.keys(nodes.value).find(
              (key) => nodes.value[key].name === payload.name
            )
          ) {
            //yes, the best solution would be include uuid lib into project, but irl uuid woulb be assigned on backend, so it seems like overkill for test task
            const newUuid = (Math.random() * 1000).toString();
            nodes.value[newUuid] = {
              uuid: newUuid,
              ...payload,
              ...getNodeAppearanceFromType(payload.type),
            };
            res();
          } else {
            rej({ code: ErrorCodes.NAME_TAKEN });
          }
        }, 2000)
      );
    } catch (e: any) {
      if ("code" in e && e.code === ErrorCodes.NAME_TAKEN) {
        throw e;
      }
      console.error(e);
    } finally {
      isAddNodeLoading.value = false;
    }
  };

  const isUpdateNodeLoading = ref(false);
  const updateNode = async (payload: {
    uuid: string;
    name: string;
    type: NodeType;
  }) => {
    try {
      isUpdateNodeLoading.value = true;
      await new Promise<void | { code: ErrorCodes }>((res, rej) =>
        setTimeout(() => {
          if (
            !Object.keys(nodes.value).find(
              (key) =>
                key !== payload.uuid && nodes.value[key].name === payload.name
            )
          ) {
            nodes.value[payload.uuid] = {
              ...payload,
              ...getNodeAppearanceFromType(payload.type),
            };
            res();
          } else {
            rej({ code: ErrorCodes.NAME_TAKEN });
          }
        }, 2000)
      );
    } catch (e: any) {
      if ("code" in e && e.code === ErrorCodes.NAME_TAKEN) {
        throw e;
      }
      console.error(e);
    } finally {
      isUpdateNodeLoading.value = false;
    }
  };

  const isAddConnectionLoading = ref(false);
  const addConnection = async (payload: {
    sourceNodeName: string;
    targetNodeName: string;
  }) => {
    try {
      isAddConnectionLoading.value = true;
      await new Promise<void | { code: ErrorCodes }>((res, rej) =>
        setTimeout(() => {
          const sourceNodeUuid = Object.keys(nodes.value).find(
            (key) => nodes.value[key].name === payload.sourceNodeName
          );
          const targetNodeUuid = Object.keys(nodes.value).find(
            (key) => nodes.value[key].name === payload.targetNodeName
          );
          const identicalConnection = Object.keys(connections.value).find(
            (key) =>
              connections.value[key].target === targetNodeUuid &&
              connections.value[key].source == sourceNodeUuid
          );
          if (!sourceNodeUuid) {
            rej({ code: ErrorCodes.SOURCE_NODE_NOT_FOUND });
          } else if (!targetNodeUuid) {
            rej({ code: ErrorCodes.TARGET_NODE_NOT_FOUND });
          } else if (identicalConnection) {
            rej({ code: ErrorCodes.CONNECTION_ALREADY_EXISTS });
          } else {
            const newUuid = (Math.random() * 1000).toString();
            connections.value[newUuid] = {
              uuid: newUuid,
              source: sourceNodeUuid,
              target: targetNodeUuid,
            };
            res();
          }
        }, 2000)
      );
    } catch (e: any) {
      if ("code" in e) {
        throw e;
      }
      console.error(e);
    } finally {
      isAddConnectionLoading.value = false;
    }
  };

  const isUpdateConnectionLoading = ref(false);
  const updateConnection = async (payload: {
    uuid: string;
    sourceNodeName: string;
    targetNodeName: string;
  }) => {
    try {
      isUpdateConnectionLoading.value = true;
      await new Promise<void | { code: ErrorCodes }>((res, rej) =>
        setTimeout(() => {
          const sourceNodeUuid = Object.keys(nodes.value).find(
            (key) => nodes.value[key].name === payload.sourceNodeName
          );
          const targetNodeUuid = Object.keys(nodes.value).find(
            (key) => nodes.value[key].name === payload.targetNodeName
          );
          const identicalConnection = Object.keys(connections.value).find(
            (key) =>
              key !== payload.uuid &&
              connections.value[key].target === targetNodeUuid &&
              connections.value[key].source == sourceNodeUuid
          );
          if (!sourceNodeUuid) {
            rej({ code: ErrorCodes.SOURCE_NODE_NOT_FOUND });
          } else if (!targetNodeUuid) {
            rej({ code: ErrorCodes.TARGET_NODE_NOT_FOUND });
          } else if (identicalConnection) {
            rej({ code: ErrorCodes.CONNECTION_ALREADY_EXISTS });
          } else {
            connections.value[payload.uuid] = {
              uuid: payload.uuid,
              source: sourceNodeUuid,
              target: targetNodeUuid,
            };
            res();
          }
        }, 2000)
      );
    } catch (e: any) {
      if ("code" in e) {
        throw e;
      }
      console.error(e);
    } finally {
      isUpdateConnectionLoading.value = false;
    }
  };

  const isDeleteNodeLoading = ref(false);
  const deleteNode = async (nodeUuid: string) => {
    try {
      isDeleteNodeLoading.value = true;
      await new Promise<void | { code: ErrorCodes }>((res, rej) =>
        setTimeout(() => {
          delete nodes.value[nodeUuid];
          Object.keys(connections.value).forEach((key) => {
            if (
              [
                connections.value[key].source,
                connections.value[key].target,
              ].includes(nodeUuid)
            ) {
              delete connections.value[key];
            }
          });
          res();
        }, 2000)
      );
    } catch (e) {
      console.error(e);
    } finally {
      isDeleteNodeLoading.value = false;
    }
  };

  const isDeleteConnectionLoading = ref(false);
  const deleteConnection = async (connectionUuid: string) => {
    try {
      isDeleteConnectionLoading.value = true;
      await new Promise<void | { code: ErrorCodes }>((res) =>
        setTimeout(() => {
          delete connections.value[connectionUuid];
          res();
        }, 2000)
      );
    } catch (e) {
      console.error(e);
    } finally {
      isDeleteConnectionLoading.value = false;
    }
  };

  const getConnectedNodesForNode = (
    node: NodeAppearance
  ): { incoming: NodeAppearance[]; outcoming: NodeAppearance[] } =>
    Object.keys(connections.value).reduce<{
      incoming: NodeAppearance[];
      outcoming: NodeAppearance[];
    }>(
      (acc, key) => {
        const connection = connections.value[key];
        if (connection.source === node.uuid) {
          acc.outcoming.push(nodes.value[connection.target]);
        }
        if (connection.target === node.uuid) {
          acc.incoming.push(nodes.value[connection.source]);
        }
        return acc;
      },
      { incoming: [], outcoming: [] }
    );

  const getNodesFromConnection = (
    connection: NodeConnectionAppearance
  ): NodeConnectionAppearanceWithNodes => ({
    ...connection,
    target: nodes.value[connection.target],
    source: nodes.value[connection.source],
  });

  return {
    nodes,
    connections,
    isGraphDataLoading,
    fetchGraphData,
    addNode,
    isAddNodeLoading,
    addConnection,
    isAddConnectionLoading,
    deleteNode,
    deleteConnection,
    getConnectedNodesForNode,
    getNodesFromConnection,
    isDeleteNodeLoading,
    isDeleteConnectionLoading,
    updateNode,
    updateConnection,
    isUpdateConnectionLoading,
    isUpdateNodeLoading,
  };
});
