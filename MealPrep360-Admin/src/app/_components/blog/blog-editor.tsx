'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Box, Paper, IconButton, Tooltip, Divider } from '@mui/material';
import {
	FormatBold,
	FormatItalic,
	FormatListBulleted,
	FormatListNumbered,
	FormatQuote,
	Link as LinkIcon,
	Image as ImageIcon,
} from '@mui/icons-material';
import React, { useEffect } from 'react';

interface BlogEditorProps {
	content: string;
	onChange: (content: string) => void;
}

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Image,
			Link.configure({
				openOnClick: false,
			}),
		],
		content,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
	});

	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content);
		}
	}, [content, editor]);

	if (!editor) {
		return null;
	}

	const addImage = () => {
		const url = window.prompt('Enter image URL');
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	};

	const addLink = () => {
		const url = window.prompt('Enter URL');
		if (url) {
			editor.chain().focus().setLink({ href: url }).run();
		}
	};

	return (
		<Paper
			variant='outlined'
			sx={{
				'& .ProseMirror': {
					minHeight: '300px',
					padding: '1rem',
					'&:focus': {
						outline: 'none',
					},
					'& p': {
						margin: '0.5em 0',
						lineHeight: 1.6,
					},
					'& h1, & h2, & h3, & h4, & h5, & h6': {
						margin: '1em 0 0.5em',
						lineHeight: 1.3,
					},
					'& ul, & ol': {
						padding: '0 1rem',
						margin: '0.5em 0',
					},
					'& li': {
						margin: '0.3em 0',
					},
					'& blockquote': {
						borderLeft: '3px solid #ccc',
						paddingLeft: '1rem',
						margin: '1em 0',
						color: '#666',
					},
					'& pre': {
						background: '#f4f4f4',
						padding: '0.5rem',
						borderRadius: '4px',
						margin: '0.5em 0',
					},
					'& code': {
						background: '#f4f4f4',
						padding: '0.2rem 0.4rem',
						borderRadius: '4px',
					},
					'& img': {
						maxWidth: '100%',
						height: 'auto',
						margin: '1em 0',
					},
				},
			}}
		>
			<Box
				sx={{
					p: 1,
					borderBottom: 1,
					borderColor: 'divider',
					display: 'flex',
					flexWrap: 'wrap',
					gap: 0.5,
					alignItems: 'center',
				}}
			>
				<Tooltip title='Bold'>
					<IconButton
						size='small'
						onClick={() => editor.chain().focus().toggleBold().run()}
						color={editor.isActive('bold') ? 'primary' : 'default'}
					>
						<FormatBold />
					</IconButton>
				</Tooltip>

				<Tooltip title='Italic'>
					<IconButton
						size='small'
						onClick={() => editor.chain().focus().toggleItalic().run()}
						color={editor.isActive('italic') ? 'primary' : 'default'}
					>
						<FormatItalic />
					</IconButton>
				</Tooltip>

				<Divider
					orientation='vertical'
					flexItem
					sx={{ mx: 1 }}
				/>

				<Tooltip title='Bullet List'>
					<IconButton
						size='small'
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						color={editor.isActive('bulletList') ? 'primary' : 'default'}
					>
						<FormatListBulleted />
					</IconButton>
				</Tooltip>

				<Tooltip title='Ordered List'>
					<IconButton
						size='small'
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						color={editor.isActive('orderedList') ? 'primary' : 'default'}
					>
						<FormatListNumbered />
					</IconButton>
				</Tooltip>

				<Tooltip title='Quote'>
					<IconButton
						size='small'
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						color={editor.isActive('blockquote') ? 'primary' : 'default'}
					>
						<FormatQuote />
					</IconButton>
				</Tooltip>

				<Divider
					orientation='vertical'
					flexItem
					sx={{ mx: 1 }}
				/>

				<Tooltip title='Add Link'>
					<IconButton
						size='small'
						onClick={addLink}
						color={editor.isActive('link') ? 'primary' : 'default'}
					>
						<LinkIcon />
					</IconButton>
				</Tooltip>

				<Tooltip title='Add Image'>
					<IconButton
						size='small'
						onClick={addImage}
					>
						<ImageIcon />
					</IconButton>
				</Tooltip>
			</Box>

			<Box sx={{ p: 2 }}>
				<EditorContent editor={editor} />
			</Box>
		</Paper>
	);
}
