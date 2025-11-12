/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as ai from "../ai.js";
import type * as airtable from "../airtable.js";
import type * as airtableMutation from "../airtableMutation.js";
import type * as analytics from "../analytics.js";
import type * as answers from "../answers.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as conversations from "../conversations.js";
import type * as email from "../email.js";
import type * as exports from "../exports.js";
import type * as files from "../files.js";
import type * as forms from "../forms.js";
import type * as google from "../google.js";
import type * as googleMutation from "../googleMutation.js";
import type * as http from "../http.js";
import type * as hubspot from "../hubspot.js";
import type * as hubspotMutation from "../hubspotMutation.js";
import type * as integrationActions from "../integrationActions.js";
import type * as integrations from "../integrations.js";
import type * as notion from "../notion.js";
import type * as notionMutation from "../notionMutation.js";
import type * as questions from "../questions.js";
import type * as responses from "../responses.js";
import type * as salesforce from "../salesforce.js";
import type * as salesforceMutation from "../salesforceMutation.js";
import type * as slack from "../slack.js";
import type * as slackMutation from "../slackMutation.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  ai: typeof ai;
  airtable: typeof airtable;
  airtableMutation: typeof airtableMutation;
  analytics: typeof analytics;
  answers: typeof answers;
  auth: typeof auth;
  billing: typeof billing;
  conversations: typeof conversations;
  email: typeof email;
  exports: typeof exports;
  files: typeof files;
  forms: typeof forms;
  google: typeof google;
  googleMutation: typeof googleMutation;
  http: typeof http;
  hubspot: typeof hubspot;
  hubspotMutation: typeof hubspotMutation;
  integrationActions: typeof integrationActions;
  integrations: typeof integrations;
  notion: typeof notion;
  notionMutation: typeof notionMutation;
  questions: typeof questions;
  responses: typeof responses;
  salesforce: typeof salesforce;
  salesforceMutation: typeof salesforceMutation;
  slack: typeof slack;
  slackMutation: typeof slackMutation;
  stripe: typeof stripe;
  users: typeof users;
  webhooks: typeof webhooks;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
