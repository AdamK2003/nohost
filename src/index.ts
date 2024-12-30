import {
  processingPostStubCount,
  processNextPost,
  processNextPostStub,
  queuePostStub,
} from "./processing/posts.js";
import {
  processingProjectsCount,
  processNextProject,
} from "./processing/projects.js";
import {
  processingTagsCount,
  processNextTag,
  queueTag,
} from "./processing/tags.js";
import { config } from "./defs.js";
import { processNextComment } from "./processing/comments.js";

let emptyCounter = 0;

async function queueLoop() {
  await processNextPostStub();
  await processNextPost();
  await processNextProject();
  await processNextTag();
  await processNextComment();

  if (
    !processingPostStubCount() &&
    !processingProjectsCount() &&
    !processingTagsCount()
  ) {
    emptyCounter++;
  } else {
    emptyCounter = 0;
  }
  if (emptyCounter <= 60 / 5) {
    setTimeout(queueLoop, 5 * 1000);
  }
}

for (const post of config.seeds.posts || []) {
  await queuePostStub(post);
}

for (const tag of config.seeds.tags || []) {
  await queueTag(tag);
}

queueLoop();
