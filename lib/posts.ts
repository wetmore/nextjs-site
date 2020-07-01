import fs from "fs";
import path, { parse } from "path";
import matter from "gray-matter";
import { md, mdTitle, htmlParser } from "./parsers";
import { findOne, getText, removeElement } from "domutils";

const postsDirectory = path.join(process.cwd(), "posts");

/** All forms of a post title. */
export interface PostTitle {
  raw: string;
  html: string;
  plaintext: string;
}

/** All metadata about a post. */
export interface PostMetadata {
  id: string;
  date: string;
  title: PostTitle;
}

/** All data necessary to render a post page. */
export interface PostData extends PostMetadata {
  contentHtml: string;
}

/**
 * Render a title which is specified with markdown. Titles are rendered into
 * HTML (to be used on the page) and plaintext (to be used as the posts HTML
 * title, i.e. what shows up in tab).
 *
 * Example output:
 *    {
 *      raw: '$\lambda$',
 *      html: '<span class="katex">...(html for rendered latex)...</span>',
 *      plaintext: 'λ'
 *    }
 *
 * @param raw The title, as written in front matter (markdown format)
 */
async function renderTitle(raw: string): Promise<PostTitle> {
  const html = mdTitle.renderInline(raw);

  // In order to render as plaintext, we use the innerText of the rendered html.
  // katex creates two nodes that represent rendered math, one with html and
  // one with mathml. Getting the innerText when both are present in the title
  // html leads to duplication in the output, so before getting innerText, we
  // remove the mathml node.
  // This is all to avoid bumping the katex in markdown-it-katex to 0.11.1,
  // which would let us use "output=html" to render the title without mathml,
  // because bumping the version messed up some math rendering for some reason.
  let dom = await htmlParser(html);

  const mathml = findOne(
    (el) => {
      return el.attribs["class"] === "katex-mathml";
    },
    dom instanceof Array ? dom : [dom],
    true
  );

  if (mathml) {
    removeElement(mathml);
  }

  const plaintext = getText(dom);

  return { raw, html, plaintext };
}

/**
 * Get post data for all posts in /posts, sorted by date.
 */
export async function getSortedPostsMetadata(): Promise<PostMetadata[]> {
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = await Promise.all(
    fileNames.map(async (fileName) => {
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

  const date = matterResult.data.date as string;
  const title = await renderTitle(matterResult.data.title);
  const contentHtml = md.render(matterResult.content);

  return { id, date, title, contentHtml };
}
