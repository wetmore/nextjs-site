import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import PostList from "../components/postList";
import { getSortedPostsMetadata } from "../lib/posts";
import { PageMetadata } from "../lib/mdPage";
import Link from "next/link";

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
        <h1 style={{ textAlign: "center" }}>All Posts</h1>
        <PostList postsData={props.allPostsData}></PostList>
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
