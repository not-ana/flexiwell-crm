// Blog posts configuration for SEO-optimized content
// These are comparison and best-of articles targeting high-intent keywords

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  readTime: string;
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "flexiwell-vs-tecnofit",
    title: "FlexiWell vs Tecnofit: Which Studio Management Software is Right for You?",
    description: "A comprehensive comparison of FlexiWell and Tecnofit for fitness studios. Compare features, pricing, AI capabilities, and integrations to find the best fit for your business.",
    date: "2026-01-05",
    author: "FlexiWell Team",
    category: "Comparisons",
    tags: ["comparison", "tecnofit", "studio software", "CRM"],
    readTime: "8 min read",
    featured: true,
  },
  {
    slug: "flexiwell-vs-glofox",
    title: "FlexiWell vs Glofox: Complete Comparison Guide 2026",
    description: "Detailed comparison between FlexiWell and Glofox gym management software. Discover which platform offers better value, features, and support for your fitness business.",
    date: "2026-01-04",
    author: "FlexiWell Team",
    category: "Comparisons",
    tags: ["comparison", "glofox", "gym software", "management"],
    readTime: "10 min read",
    featured: true,
  },
  {
    slug: "best-pilates-studio-software-2026",
    title: "Best Pilates Studio Software in 2026: Complete Guide",
    description: "Discover the top Pilates studio management software options for 2026. Compare features, pricing, and capabilities to find the perfect solution for your reformer or mat studio.",
    date: "2026-01-03",
    author: "FlexiWell Team",
    category: "Guides",
    tags: ["pilates", "studio software", "best of", "guide"],
    readTime: "12 min read",
    featured: true,
  },
  {
    slug: "mindbody-alternatives",
    title: "10 Best MindBody Alternatives in 2026: Complete Comparison",
    description: "Looking for MindBody alternatives? Compare the top 10 gym and studio management software options with better pricing, features, and customer support.",
    date: "2026-01-02",
    author: "FlexiWell Team",
    category: "Comparisons",
    tags: ["mindbody", "alternatives", "comparison", "gym software"],
    readTime: "15 min read",
    featured: true,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}
