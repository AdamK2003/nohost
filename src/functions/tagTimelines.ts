import * as cheerio from "cheerio";
import * as types from "../types/types.js";
import { ax, config } from "../defs.js";
import { time } from "console";
import { queuePostStub } from "../processing/posts.js";
import { postToPostStub } from "./posts.js";
import { sleep } from "./utils.js";

export async function getTagTimeline(
  tag: string,
  offset: number | undefined = undefined,
  refTimestamp: number | undefined = undefined,
  getAll: boolean = true
): Promise<types.TagTimelinePage | null> {
  let querystring: any[] | string = [];

  if (offset) querystring.push(`offset=${offset}`);
  if (refTimestamp) querystring.push(`refTimestamp=${refTimestamp}`);

  querystring = querystring.join("&");

  let url = `/rc/tagged/${tag}`;
  if (querystring != "") url += `?${querystring}`;

  let page: types.TagTimelinePage | null = null;
  let retries = 0;
  while (!page) {
    try {
      const response = await ax.get(url);

      const $ = cheerio.load(response.data);

      page = JSON.parse($("head script[id=__COHOST_LOADER_STATE__]").text())[
        "tagged-post-feed"
      ] as types.TagTimelinePage;
    } catch (e) {
      console.log("Error getting offset %d for tag timeline %d", offset, tag);
      retries++;
      await sleep(1000);
    }
    if (retries >= (config.maxRetries || 10)) break;
  }

  if (!page) return null;
  if (getAll) {
    for (const post of page.posts) {
      queuePostStub(postToPostStub(post));
    }
    sleep(config.ratelimits?.tags || 500);
    if (page.paginationMode.morePagesForward) {
      getTagTimeline(
        tag,
        page.paginationMode.currentSkip + page.paginationMode.idealPageStride,
        refTimestamp || page.paginationMode.refTimestamp
      );
    }
  }

  return page;
}

export function tagTimelinePageToTag(page: types.TagTimelinePage): types.Tag {
  // quick util function
  return {
    name: page.tagName,
    relationships: page.synonymsAndRelatedTags,
  };
}
