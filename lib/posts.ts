import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  markdownDir,
  renderTitle,
  PageData,
  PageMetadata,
  getAllPageIds,
  getPageData,
} from "./mdPage";

const postsDirectory = path.join(markdownDir, "posts");

/**
 * Get post data for all posts in /posts, sorted by date.
 */
export async function getSortedPostsMetadata(): Promise<PageMetadata[]> {
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".md"))
      .map(async (fileName) => {
        // Remove ".md" from file name to get id
        const id = fileName.replace(/\.md$/, "");

        // Read markdown file as string
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf8");

        // Use gray-matter to parse the post metadata section
        const matterResult = matter(fileContents);

        // Render the title
        const title = await renderTitle(matterResult.data.title);
        const date = matterResult.data.date as string;

        // Combine the data with the id
        return { id, date, title };
      })
  );

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

/**
 * Get post ids for all posts in /posts.
 */
export function getAllPostIds() {
  return getAllPageIds("posts");
}

/**
 * Get all post data for a particular post.
 *
 * @param id Post identifier, e.g. "about" or "posts/my-post"
 */
export async function getPostData(id: string): Promise<PageData> {
  return getPageData(`posts/${id}`);
}
