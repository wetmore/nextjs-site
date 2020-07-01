export default function Title(props: { title: string }) {
  return <span dangerouslySetInnerHTML={{ __html: props.title }}></span>;
}
