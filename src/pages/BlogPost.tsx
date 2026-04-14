import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, CalendarDays } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PortableText from "@/components/PortableText";
import { sanityClient, urlFor, POST_QUERY } from "@/lib/sanity";

interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  mainImage?: any;
  body?: any[];
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => sanityClient.fetch<Post>(POST_QUERY, { slug }),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-6">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-64 bg-muted rounded-xl" />
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
            <p className="text-muted-foreground mb-6">This blog post doesn't exist or has been removed.</p>
            <Link to="/blog" className="text-primary font-medium hover:underline">
              ← Back to blog
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const ogImage = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).auto("format").url()
    : undefined;

  return (
    <>
      <Helmet>
        <title>{post.seoTitle} | Border Pay</title>
        <meta name="description" content={post.seoDescription} />
        <meta property="og:title" content={post.seoTitle} />
        <meta property="og:description" content={post.seoDescription} />
        <meta property="og:type" content="article" />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="article:published_time" content={post.publishedAt} />
        <link rel="canonical" href={`https://borderpay-express-interest.lovable.app/blog/${post.slug}`} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Back to blog
          </Link>

          <article>
            <header className="mb-8">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <CalendarDays size={12} />
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </header>

            {post.mainImage && (
              <div className="mb-10 overflow-hidden rounded-xl border border-border">
                <img
                  src={urlFor(post.mainImage).width(800).auto("format").url()}
                  alt={post.mainImage.alt || post.title}
                  className="w-full"
                />
              </div>
            )}

            {post.body && <PortableText value={post.body} />}
          </article>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BlogPost;
