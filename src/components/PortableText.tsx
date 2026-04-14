import { urlFor } from "@/lib/sanity";

interface Block {
  _key: string;
  _type: string;
  style?: string;
  children?: { _key: string; text: string; marks?: string[] }[];
  markDefs?: { _key: string; _type: string; href?: string }[];
  asset?: any;
  alt?: string;
  listItem?: string;
  level?: number;
}

const PortableText = ({ value }: { value: Block[] }) => {
  if (!value) return null;

  return (
    <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl">
      {value.map((block) => {
        if (block._type === "image" && block.asset) {
          return (
            <figure key={block._key} className="my-8">
              <img
                src={urlFor(block).width(800).auto("format").url()}
                alt={block.alt || ""}
                className="rounded-xl w-full"
                loading="lazy"
              />
              {block.alt && (
                <figcaption className="text-center text-sm text-muted-foreground mt-2">
                  {block.alt}
                </figcaption>
              )}
            </figure>
          );
        }

        if (block._type !== "block") return null;

        const renderChildren = (children: Block["children"]) =>
          children?.map((child) => {
            let el: React.ReactNode = child.text;

            if (child.marks?.includes("strong")) el = <strong key={child._key}>{el}</strong>;
            if (child.marks?.includes("em")) el = <em key={child._key}>{el}</em>;
            if (child.marks?.includes("code")) el = <code key={child._key}>{el}</code>;

            // Handle link marks
            const linkMark = child.marks?.find(
              (m) => m !== "strong" && m !== "em" && m !== "code"
            );
            if (linkMark && block.markDefs) {
              const def = block.markDefs.find((d) => d._key === linkMark);
              if (def?._type === "link" && def.href) {
                el = (
                  <a
                    key={child._key}
                    href={def.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {el}
                  </a>
                );
              }
            }

            return <span key={child._key}>{el}</span>;
          });

        const content = renderChildren(block.children);

        switch (block.style) {
          case "h1":
            return <h1 key={block._key}>{content}</h1>;
          case "h2":
            return <h2 key={block._key}>{content}</h2>;
          case "h3":
            return <h3 key={block._key}>{content}</h3>;
          case "h4":
            return <h4 key={block._key}>{content}</h4>;
          case "blockquote":
            return <blockquote key={block._key}>{content}</blockquote>;
          default:
            if (block.listItem === "bullet") {
              return <li key={block._key}>{content}</li>;
            }
            if (block.listItem === "number") {
              return <li key={block._key}>{content}</li>;
            }
            return <p key={block._key}>{content}</p>;
        }
      })}
    </div>
  );
};

export default PortableText;
