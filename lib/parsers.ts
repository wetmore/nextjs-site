import { promisify } from "util";
import MarkdownIt from "markdown-it";
import iterator from "markdown-it-for-inline";
import { Parser } from "htmlparser2";
import { DomHandler, Node } from "domhandler";

export const md = MarkdownIt({ html: true, typographer: true })
  .use(require("markdown-it-katex"))
  .use(require("markdown-it-highlightjs"), { inline: true })
  .use(require("markdown-it-footnote"));
//.use(require("markdown-it-github-headings"), { prefixHeadingIds: false });

export const mdTitle = MarkdownIt({ html: false, typographer: true })
  .use(require("markdown-it-katex"))
  .use(require("markdown-it-highlightjs"), { inline: false })
  .use(require("markdown-it-footnote"));

const parseHtml = (rawHtml: string, cb: (err, dom: Node | Node[]) => void) => {
  const parser = new Parser(new DomHandler(cb));
  parser.write(rawHtml);
  parser.end();
};

export const htmlParser = promisify(parseHtml);
