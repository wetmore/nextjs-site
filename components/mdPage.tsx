import Layout from "./layout";
import { PageData } from "../lib/mdPage";
import Head from "next/head";
import Date from "./date";
import PostTitle from "./postTitle";
import utilStyles from "../styles/utils.module.css";

export default function MdPage(props: { postData: PageData }) {
  const { title, date, contentHtml } = props.postData;
  return (
    <Layout>
      <Head>
        <title>{title.plaintext}</title>
      </Head>
      <article>
        <h1 style={{ textAlign: "center" }}>
          <PostTitle title={title.html} />
        </h1>
        {date && (
          <div style={{ textAlign: "center" }} className={utilStyles.lightText}>
            <Date dateString={date} />
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </article>
    </Layout>
  );
}
