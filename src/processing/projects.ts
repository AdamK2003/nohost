import { getProject, insertProject } from "../db/functions.js";
import { config } from "../defs.js";
import { fetchPostsFromProject } from "../functions/projects.js";
import { shiftSet, sleep } from "../functions/utils.js";
import * as types from "../types/types.js";
import { queueTag } from "./tags.js";

let projectQueue: Set<string> = new Set<string>();
let processingProjects: Set<number> = new Set<number>();
let processedProjects: Set<number> = new Set<number>();

export async function processNextProject() {
  const next = shiftSet(projectQueue);
  if (next && processingProjectsCount() < (config.concurrency?.projects || 2)) {
    const project = await getProject(next);
    if (project) {
      processProject(project);
      return true;
    }
  }
  return false;
}

export function processingProjectsCount() {
  return processingProjects.size;
}

export async function queueProject(project: types.Project) {
  if (!project || processedProjects.has(project.projectId)) return;
  await insertProject(project);
  if (projectQueue.add(project.handle))
    console.log("Queued project", project.handle);
}

export async function processProject(project: types.Project) {
  if (processedProjects.has(project.projectId)) return;
  processingProjects.add(project.projectId);
  console.log("Processing project", project.handle);

  try {
    extractTagsFromProject(project);
    await fetchPostsFromProject(project.handle); // network
    processedProjects.add(project.projectId);
  } catch (e) {
    console.log("Error in project %d, requeueing", project.handle);
    console.debug(e);
    queueProject(project);
  }
  sleep(config.ratelimits?.projects || 500);
  processingProjects.delete(project.projectId);
  processNextProject();
}

export function extractTagsFromProject(project: types.Project) {
  for (const tag of project.frequentlyUsedTags) {
    queueTag(tag);
  }
}
