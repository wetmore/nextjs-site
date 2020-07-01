import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";
import { getSortedPostsMetadata, PostMetadata } from "../lib/posts";
import Link from "next/link";
import Date from "../components/date";
import PostTitle from "../components/postTitle";

interface HomeProps {
  allPostsData: PostMetadata[];
}

export default function Home(props: HomeProps) {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section>
        <p>
          I am a person who knows a lot about a little and a little about a lot.
          My primary interests are making, learning, and climbing. If you'd like
          to know more about me, check out the{" "}
          <Link href="/about">
            <a>about page</a>
          </Link>
          . If you'd like to know what I've done, check out the{" "}
          <Link href="/projects">
            <a>projects page</a>
          </Link>
          .
        </p>
        <p>
          I am currently looking for work. You can learn more about my by
          checking out my <a href="/cv.pdf">CV</a>.
        </p>
      </section>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Blog</h2>
        <ul className={utilStyles.list}>
          {props.allPostsData.map(({ id, date, title }) => (
            <li className={utilStyles.listItem} key={id}>
              <Link href="/posts/[id]" as={`/posts/${id}`}>
                <a>
                  <PostTitle title={title} />
                </a>
              </Link>
              <br />
              <small className={utilStyles.lightText}>
                <Date dateString={date} />
              </small>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}

export async function getStaticProps() {
  const allPostsData = getSortedPostsMetadata();
  return {
    props: {
      allPostsData,
    },
  };
}
