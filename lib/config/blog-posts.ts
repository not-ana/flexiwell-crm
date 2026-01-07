// Blog posts configuration
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  image?: string;
  readTime: number;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "flexiwell-vs-tecnofit",
    title: "FlexiWell vs Tecnofit: Complete Comparison",
    description: "A detailed comparison of studio management solutions for your business.",
    excerpt: "A detailed comparison of studio management solutions for your business.",
    date: "2025-01-07",
    author: "FlexiWell Team",
    category: "Comparison",
    readTime: 8,
    tags: ["comparison", "studio management", "tecnofit"],
  },
  {
    slug: "flexiwell-vs-glofox",
    title: "FlexiWell vs Glofox: Which is Right for You?",
    description: "Compare FlexiWell and Glofox features for your fitness studio.",
    excerpt: "Compare FlexiWell and Glofox features for your fitness studio.",
    date: "2025-01-06",
    author: "FlexiWell Team",
    category: "Comparison",
    readTime: 7,
    tags: ["comparison", "studio management", "glofox"],
  },
  {
    slug: "best-pilates-studio-software-2026",
    title: "Best Pilates Studio Software in 2026",
    description: "Top software solutions for managing your Pilates studio.",
    excerpt: "Top software solutions for managing your Pilates studio.",
    date: "2025-01-05",
    author: "FlexiWell Team",
    category: "Guide",
    readTime: 10,
    tags: ["pilates", "software", "guide", "2026"],
  },
  {
    slug: "mindbody-alternatives",
    title: "Top Mindbody Alternatives for Studios",
    description: "Explore the best alternatives to Mindbody for your wellness business.",
    excerpt: "Explore the best alternatives to Mindbody for your wellness business.",
    date: "2025-01-04",
    author: "FlexiWell Team",
    category: "Comparison",
    readTime: 9,
    tags: ["comparison", "mindbody", "alternatives", "wellness"],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}
