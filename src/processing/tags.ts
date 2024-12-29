import { getTagTimeline } from "../functions/tagTimelines.js";
import { shiftSet, sleep } from "../functions/utils.js";
import * as types from "../types/types.js";
import { tagTimelinePageToTag } from "../functions/tagTimelines.js";
import { insertTag } from "../db/functions.js";
import { searchForTags } from "../functions/tags.js";
import { config } from "../defs.js";

let tagQueue: Set<string> = new Set<string>();
let processingTags: Set<string> = new Set<string>();
let processedTags: Set<string> = new Set<string>();

export async function processNextTag() {
  const next = shiftSet(tagQueue);
  if (next && processingTagsCount() < (config.concurrency?.tags || 2)) {
    processTag(next);
    return true;
  }
  return false;
}

export function processingTagsCount() {
  return processingTags.size;
}

export function queueTag(tag: string) {
  if (processedTags.has(tag)) return;
  if(tagQueue.add(tag)) console.log("Queued tag", tag);
}

export async function processTag(tag: string) {
  if (processedTags.has(tag)) return;
  processingTags.add(tag);
  console.log("Processing tag", tag);

  try {
    // this will also queue posts as a side effect
    const tagTimeline = await getTagTimeline(tag);
    if (!tagTimeline) throw Error("Tag timeline is null");
    const fullTag: types.Tag = tagTimelinePageToTag(tagTimeline);
    insertTag(fullTag);
    await getTagsFromTag(fullTag);
    processedTags.add(tag);
  } catch (e) {
    console.log("Error on tag %d, requeueing", tag);
    console.debug(e);
    queueTag(tag);
  }
  await sleep(config.ratelimits?.tags || 500);
  processingTags.delete(tag);
  processNextTag();
}

export async function getTagsFromTag(tag: types.Tag) {
  for (const relationship of tag.relationships) {
    queueTag(relationship.content);
  }
  const tagSearchResults = await searchForTags(tag.name);
  for (const result of tagSearchResults) {
    queueTag(result);
  }
}
