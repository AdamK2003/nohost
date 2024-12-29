import { ax } from "../defs.js";
import { Tag, TagTimelinePage } from "../types/types.js";

export async function searchForTags(query: string): Promise<string[]> {
  try {
    const response = await ax.get("api/v1/trpc/tags.query", {
      params: {
        batch: 0,
        input: JSON.stringify({
          "0": {
            query,
          },
        }),
      },
    });

    return response.data[0].result.data.result.map((tag: any) => tag.content);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function isTagTimelinePage(
  object: Tag | TagTimelinePage
): object is TagTimelinePage {
  return object.hasOwnProperty("paginationMode");
}
