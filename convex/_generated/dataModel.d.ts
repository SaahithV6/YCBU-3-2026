/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { GenericId } from "convex/values";

export type Id<TableName extends string> = GenericId<TableName>;

export type Doc<_TableName extends string> = Record<string, any> & { _id: Id<_TableName>; _creationTime: number };
