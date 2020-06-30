import fs from "fs";
import path from "path";
import matter from "gray-matter";

import MarkdownIt from "markdown-it";
import math_plugin from "markdown-it-katex";
import highlightjs from "markdown-it-highlightjs";

const md = MarkdownIt({ html: true }).use(math_plugin).use(highlightjs);

const postsDirectory = path.join(process.cwd(), "posts");

/** Data returned from post front matter. */
interface PostFrontMatter {
  date: string;
  title: string;
}

/** All metadata about a post. */
export interface PostMetadata extends PostFrontMatter {
  id: string;
}

/** All data necessary to render a post page. */
export interface PostData extends PostMetadata {
  contentHtml: string;
}

/**
 * Get post data for all posts in /posts, sorted by date.
 */
export function getSortedPostsMetadata(): PostMetadata[] {
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, "");

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    // Combine the data with the id
    return {
      id,
      ...(matterResult.data as PostFrontMatter),
    };
  });
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
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => {
    return {
      params: {
        id: fileName.replace(/\.md$/, ""),
      },
    };
  });
}

/**
 * Get all post data for a particular post.
 *
 * @param id The id of the post to get postdata for
 */
export async function getPostData(id: string): Promise<PostData> {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Use remark to convert markdown into HTML string
  // const processedContent = await remark()
  //   .use(html)
  //   .process(matterResult.content);
  // const contentHtml = processedContent.toString();
  const contentHtml = md.render(matterResult.content);

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    ...(matterResult.data as PostFrontMatter),
  };
}
