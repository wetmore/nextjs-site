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
        <link
          rel="apple-touch-icon-precomposed"
          sizes="57x57"
          href="/images/favicon/apple-touch-icon-57x57.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="114x114"
          href="/images/favicon/apple-touch-icon-114x114.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="72x72"
          href="/images/favicon/apple-touch-icon-72x72.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="144x144"
          href="/images/favicon/apple-touch-icon-144x144.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="120x120"
          href="/images/favicon/apple-touch-icon-120x120.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="152x152"
          href="/images/favicon/apple-touch-icon-152x152.png"
        />
        <link
          rel="icon"
          type="image/png"
          href="/images/favicon/favicon-32x32.png"
          sizes="32x32"
        />
        <link
          rel="icon"
          type="image/png"
          href="/images/favicon/favicon-16x16.png"
          sizes="16x16"
        />
        <meta name="application-name" content="&nbsp;" />
        <meta name="msapplication-TileColor" content="#FFFFFF" />
        <meta
          name="msapplication-TileImage"
          content="/images/favicon/mstile-144x144.png"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css"
        />
        <link
          rel="stylesheet"
          href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/styles/github.min.css"
        ></link>
        <meta name="description" content="Matt Wetmore's Personal Website" />
        <meta
          property="og:image"
          content={`https://og-image.now.sh/${encodeURI(
            siteTitle
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.zeit.co%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1,user-scalable=no"
        ></meta>
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
          <a href="//github.com/wetmore/nextjs-site">Source</a> on Github
        </span>
        <Link href="/colophon">
          <a>About this website</a>
        </Link>
      </div>
    </>
  );
}
