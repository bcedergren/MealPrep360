export interface BlogContent {
	title: string;
	content: string;
	excerpt: string;
}

export interface TextGenerator {
	generateContent(topic: string, keywords: string[]): Promise<BlogContent>;
}

export interface ImageGenerator {
	generateImage(prompt: string): Promise<string>;
}

export interface ContentGenerator extends TextGenerator, ImageGenerator {}
