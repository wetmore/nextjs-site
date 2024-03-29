import MdPage from "../../components/mdPage";
import { getAllPostIds, getPostData } from "../../lib/posts";

export default MdPage;

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.id as string);
  return {
    props: {
      postData,
    },
  };
}
