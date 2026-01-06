import Link from "next/link";
import Image from "next/image";
import { blogPosts } from "@/lib/config/blog-posts";

export const metadata = {
  title: "Blog | FlexiWell - Studio Management Insights",
  description: "Expert insights, comparisons, and guides for fitness studio owners. Learn how to grow your Pilates, yoga, or gym business with the right software.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
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

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            FlexiWell Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expert insights, software comparisons, and guides to help you run a more successful wellness business.
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white/20 text-6xl font-bold">
                    {post.category === "Comparisons" ? "VS" : "#1"}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                      {post.category}
                    </span>
                    <span className="text-gray-400 text-sm">{post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary-600">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{post.date}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-primary-600 font-medium text-sm hover:text-primary-700"
                    >
                      Read more &rarr;
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to try FlexiWell?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Start your 30-day free trial today. Cancel anytime.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-colors"
          >
            Start Free Trial
          </Link>
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
