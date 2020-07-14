import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";
import { getSortedPostsMetadata } from "../lib/posts";
import { PageMetadata } from "../lib/mdPage";
import Link from "next/link";
import Date from "../components/date";
import PostTitle from "../components/postTitle";

interface HomeProps {
  allPostsData: PageMetadata[];
}

export default function Home(props: HomeProps) {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section>
        <p>
          Hello! As you may have guessed, my name is Matt Wetmore. Over the
          course of my life I've been interested in many different things, but
          right now my biggest interests are programming and rock climbing.
          Sometimes I write about{" "}
          <Link href="/archive">
            <a>here</a>
          </Link>
          . If you'd like to know more about who I am, you should check out my{" "}
          <Link href="/about">
            <a>about page</a>
          </Link>
          . If you'd like to know more about some things I've worked on, check
          out the{" "}
          <Link href="/projects">
            <a>projects page</a>
          </Link>
          .
        </p>
        <p>
          I am currently looking for work. You can learn more about my
          experience by checking out my <a href="/files/resume.pdf">resume</a>.
        </p>
      </section>
      <section>
        <h1>Writing</h1>
        <ul className={utilStyles.list}>
          {props.allPostsData.map(({ id, date, title }) => (
            <li key={id}>
              <Link href="/posts/[id]" as={`/posts/${id}`}>
                <a>
                  <PostTitle title={title.html} />
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
  const allPostsData = await getSortedPostsMetadata();
  return {
    props: {
      allPostsData,
    },
  };
}
