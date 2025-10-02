import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SocialProfile, SocialPost, SocialComment } from '@/models';

// POST /api/social/posts/[postId]/interactions
export async function POST(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const postId = req.url.split('/').slice(-2)[0];
		const { type, content } = await req.json();

		if (!type || !['like', 'comment'].includes(type)) {
			return NextResponse.json(
				{ error: 'Invalid interaction type' },
				{ status: 400 }
			);
		}

		// Get user's profile
		const userProfile = await SocialProfile.findOne({ userId });
		if (!userProfile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Get the post
		const post = await SocialPost.findById(postId);
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		if (type === 'like') {
			// Check if already liked
			if (post.likes.includes(userProfile._id)) {
				return NextResponse.json(
					{ error: 'Already liked this post' },
					{ status: 400 }
				);
			}

			// Add like
			post.likes.push(userProfile._id);
			await post.save();

			return NextResponse.json({ message: 'Post liked successfully' });
		} else if (type === 'comment') {
			if (!content) {
				return NextResponse.json(
					{ error: 'Comment content is required' },
					{ status: 400 }
				);
			}

			// Create comment
			const comment = await SocialComment.create({
				postId: post._id,
				authorId: userProfile._id,
				content,
			});

			// Add comment to post
			post.comments.push(comment._id);
			await post.save();

			// Populate author information
			await comment.populate('authorId', 'userId displayName avatar');

			return NextResponse.json(comment);
		}
	} catch (error) {
		console.error('Error interacting with post:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/social/posts/[postId]/interactions
export async function DELETE(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const postId = req.url.split('/').slice(-2)[0];
		const { type, commentId } = await req.json();

		if (!type || !['like', 'comment'].includes(type)) {
			return NextResponse.json(
				{ error: 'Invalid interaction type' },
				{ status: 400 }
			);
		}

		// Get user's profile
		const userProfile = await SocialProfile.findOne({ userId });
		if (!userProfile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Get the post
		const post = await SocialPost.findById(postId);
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		if (type === 'like') {
			// Remove like
			post.likes = post.likes.filter(
				(id) => id.toString() !== userProfile._id.toString()
			);
			await post.save();

			return NextResponse.json({ message: 'Post unliked successfully' });
		} else if (type === 'comment') {
			if (!commentId) {
				return NextResponse.json(
					{ error: 'Comment ID is required' },
					{ status: 400 }
				);
			}

			// Get the comment
			const comment = await SocialComment.findById(commentId);
			if (!comment) {
				return NextResponse.json(
					{ error: 'Comment not found' },
					{ status: 404 }
				);
			}

			// Check if user is the author
			if (comment.authorId.toString() !== userProfile._id.toString()) {
				return NextResponse.json(
					{ error: 'Not authorized to delete this comment' },
					{ status: 403 }
				);
			}

			// Remove comment from post
			post.comments = post.comments.filter((id) => id.toString() !== commentId);
			await post.save();

			// Delete the comment
			await SocialComment.deleteOne({ _id: commentId });

			return NextResponse.json({ message: 'Comment deleted successfully' });
		}
	} catch (error) {
		console.error('Error removing interaction:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
