export interface BlogPost {
	title: string;
	content: string;
	slug: string;
	featuredImage?: string;
	excerpt: string;
	author: string;
	tags: string[];
	status: 'draft' | 'published';
	createdAt: Date;
	updatedAt: Date;
}

export interface BlogPostData
	extends Omit<BlogPost, 'createdAt' | 'updatedAt' | 'slug'> {
	slug?: string;
}
