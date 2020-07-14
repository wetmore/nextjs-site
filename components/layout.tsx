import Head from "next/head";
import styles from "./layout.module.scss";
import Link from "next/link";

export const siteTitle = "Matt Wetmore";

interface LayoutProps {
  children: React.ReactNode;
  home?: boolean;
}

/**
 * Default layout used for all pages of the website.
 */
export default function Layout({ children, home }: LayoutProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css"
        />
        <link
          rel="stylesheet"
          href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/styles/github.min.css"
        ></link>
        <meta
          name="description"
          content="Learn how to build a personal website using Next.js"
        />
        <meta
          property="og:image"
          content={`https://og-image.now.sh/${encodeURI(
            siteTitle
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.zeit.co%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <header className={styles.header}>
        <div className={styles.title}>Matt Wetmore</div>
        <div className={styles.navi}>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/files/resume.pdf">Resume</a>
          <a href="/projects">Projects</a>
          <a href="/posts">Posts</a>
        </div>
        <div className={styles.bird}></div>
      </header>
      <main className={styles.content}>{children}</main>
      <div className={styles.footer}>
        <span className={styles.left}>
          <a href="//github.com/wetmore/">Source</a> on Github (add)
        </span>
        <Link href="/colophon">
          <a>About this website</a>
        </Link>
      </div>
    </>
  );
}
