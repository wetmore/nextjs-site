import MdPage from "../components/mdPage";
import { getAllPageIds, getPageData } from "../lib/mdPage";

export default MdPage;

export async function getStaticPaths() {
  const paths = getAllPageIds("");
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const postData = await getPageData(params.id as string);
  return {
    props: {
      postData,
    },
  };
}
