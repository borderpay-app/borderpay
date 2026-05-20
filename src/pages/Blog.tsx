import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { sanityClient, urlFor, POSTS_QUERY } from "@/lib/sanity";
import { CalendarDays } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  mainImage?: any;
  publishedAt: string;
}

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => sanityClient.fetch<Post[]>(POSTS_QUERY),
  });

  return (
    <>
      <Helmet>
        <title>Blog — Border Pay</title>
        <meta name="description" content="Insights on cross-border payments, stablecoins, and the future of financial infrastructure between the UK and Ireland." />
        <meta property="og:title" content="Border Pay Blog" />
        <meta property="og:description" content="Insights on cross-border payments, stablecoins, and financial infrastructure between the UK and Ireland." />
        <meta property="og:url" content="https://borderpay.app/blog" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://borderpay.app/blog" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Blog</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Insights & Updates
            </h1>
            <p className="mt-3 text-muted-foreground">
              Thoughts on cross-border payments, regulation, and building the future of UK–Ireland commerce.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-xl h-52 mb-4" />
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : !posts?.length ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-10">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className="group block"
                >
                  <article className="grid sm:grid-cols-[280px_1fr] gap-6 items-start">
                    {post.mainImage?.asset ? (
                      <div className="overflow-hidden rounded-xl border border-border">
                        <img
                          src={urlFor(post.mainImage).width(560).height(360).auto("format").url()}
                          alt={post.mainImage.alt || post.title}
                          className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-44 rounded-xl bg-muted flex items-center justify-center border border-border">
                        <span className="text-muted-foreground text-sm">No image</span>
                      </div>
                    )}

                    <div className="py-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <CalendarDays size={12} />
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </time>
                      </div>

                      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}

                      <span className="inline-block mt-3 text-xs font-medium text-primary">
                        Read more →
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Blog;
