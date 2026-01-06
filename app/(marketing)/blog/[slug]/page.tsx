import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBlogPost, blogPosts } from "@/lib/config/blog-posts";

// Import blog content components
import FlexiWellVsTecnofit from "./content/flexiwell-vs-tecnofit";
import FlexiWellVsGlofox from "./content/flexiwell-vs-glofox";
import BestPilatesSoftware from "./content/best-pilates-studio-software-2026";
import MindbodyAlternatives from "./content/mindbody-alternatives";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Post Not Found | FlexiWell Blog",
    };
  }

  return {
    title: `${post.title} | FlexiWell Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

const contentComponents: Record<string, React.ComponentType> = {
  "flexiwell-vs-tecnofit": FlexiWellVsTecnofit,
  "flexiwell-vs-glofox": FlexiWellVsGlofox,
  "best-pilates-studio-software-2026": BestPilatesSoftware,
  "mindbody-alternatives": MindbodyAlternatives,
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const ContentComponent = contentComponents[slug];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/flexiwell-logo.svg" alt="FlexiWell" width={120} height={28} />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/blog" className="text-sm font-medium text-primary-600">
                Blog
              </Link>
              <Link href="/bundle" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Website Bundle
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/blog" className="text-gray-500 hover:text-gray-700">Blog</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{post.category}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
              {post.category}
            </span>
            <span className="text-gray-400">{post.readTime}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {post.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>By {post.author}</span>
            <span>&bull;</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-600 prose-ol:text-gray-600">
          {ContentComponent ? <ContentComponent /> : <p>Content coming soon...</p>}
        </div>

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-600 to-purple-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to try FlexiWell?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Start your 30-day free trial today. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3 border-2 border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Image src="/flexiwell-logo.svg" alt="FlexiWell" width={100} height={24} className="brightness-200" />
            <p className="text-sm">&copy; 2026 FlexiWell. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
