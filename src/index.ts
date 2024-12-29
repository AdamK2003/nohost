import {
  processingPostsCount,
  processNextPost,
  queuePost,
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

let emptyCounter = 0;

async function queueLoop() {
  await processNextPost();
  await processNextProject();
  await processNextTag();

  if (
    !processingPostsCount() &&
    !processingProjectsCount() &&
    !processingTagsCount()
  ) {
    emptyCounter++;
  } else {
    emptyCounter = 0;
  }
  if (emptyCounter <= 10) {
    setTimeout(queueLoop, 10000);
  }
}

for (const post of config.seeds.posts || []) {
  queuePost(post);
}

for (const tag of config.seeds.tags || []) {
  queueTag(tag);
}

queueLoop();
