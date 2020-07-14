import fs from "fs";
import path, { parse } from "path";
import matter from "gray-matter";
import { md, mdTitle, htmlParser } from "./parsers";
import { getText, removeElement, findAll } from "domutils";

export const markdownDir = path.join(process.cwd(), "markdown");

/** All forms of a page title. */
export interface PageTitle {
  raw: string;
  html: string;
  plaintext: string;
}

/** All metadata about a page. */
export interface PageMetadata {
  id: string;
  date?: string;
  title: PageTitle;
}

/** All data necessary to render a page. */
export interface PageData extends PageMetadata {
  contentHtml: string;
}

/**
 * Render a title which is specified with markdown. Titles are rendered into
 * HTML (to be used on the page) and plaintext (to be used as the page's HTML
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
export async function renderTitle(raw: string): Promise<PageTitle> {
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

  const mathml = findAll(
    (el) => {
      return el.attribs["class"] === "katex-mathml";
    },
    dom instanceof Array ? dom : [dom]
  );

  for (let el of mathml) {
    removeElement(el);
  }

  const plaintext = getText(dom);

  return { raw, html, plaintext };
}

/**
 * Get page ids for all markdown pages in `root`.
 *
 * @param root Directory in which to find markdown pages.
 */
export function getAllPageIds(root: string) {
  const fileNames = fs.readdirSync(path.join(markdownDir, root));
  return fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      console.log(fileName);
      return {
        params: {
          id: fileName.replace(/\.md$/, ""),
        },
      };
    });
}

/**
 * Get all page data for a particular page.
 *
 * @param id Page identifier, e.g. "about" or "posts/my-post"
 */
export async function getPageData(id: string): Promise<PageData> {
  const fullPath = path.join(markdownDir, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  const date = (matterResult.data.date as string) || null;
  const title = await renderTitle(matterResult.data.title);
  const contentHtml = md.render(matterResult.content);

  return { id, date, title, contentHtml };
}
