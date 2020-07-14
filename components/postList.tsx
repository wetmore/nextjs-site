import styles from "./postList.module.scss";
import Date from "./date";
import PostTitle from "./postTitle";
import Link from "next/link";

export default function PostList(props) {
  return (
    <ul className={styles.postList}>
      {props.postsData.map(({ id, date, title }, index) => (
        <li key={id} className={styles.post}>
          <Link href="/posts/[id]" as={`/posts/${id}`}>
            <a>
              <PostTitle title={title.html} />
            </a>
          </Link>
          <br />
          <small>
            <Date dateString={date} />
          </small>
        </li>
      ))}
    </ul>
  );
}
