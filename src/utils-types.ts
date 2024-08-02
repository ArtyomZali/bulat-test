//it may be that all of this checks should happen on frontend
//(yes, in my implementation I do this on frontend, but with implication that it should happen on backend)
//this matter is up for discussion, because I`m not sure, that frontend will always get all of nodes and connections
export enum ErrorCodes {
  NAME_TAKEN = "NAME_TAKEN",
  TARGET_NODE_NOT_FOUND = "TARGET_NODE_NOT_FOUND",
  SOURCE_NODE_NOT_FOUND = "SOURCE_NODE_NOT_FOUND",
  CONNECTION_ALREADY_EXISTS = "CONNECTION_ALREADY_EXISTS",
}
