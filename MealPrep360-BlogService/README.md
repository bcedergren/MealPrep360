# MealPrep360 Blog Service

An AI-powered blog content generation service that uses OpenAI's GPT-4 and DALL-E 3 to create engaging blog posts with images.

## Features

- AI-powered blog content generation using GPT-4 Turbo
- Automatic image generation using DALL-E 3
- MongoDB database integration
- RESTful API endpoints
- Markdown-formatted content
- Automatic excerpt generation

## Prerequisites

- Node.js 18+ and npm
- MongoDB database
- OpenAI API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
```

## API Endpoints

### Blog Posts

#### List All Blog Posts

```http
GET /api/blog
```

Request Headers:

```http
Content-Type: application/json
```

Response:

```json
{
	"success": true,
	"data": [
		{
			"_id": "string",
			"title": "string",
			"content": "string",
			"excerpt": "string",
			"imageUrl": "string",
			"createdAt": "date",
			"updatedAt": "date"
		}
	]
}
```

Status Codes:

- 200: Success
- 500: Server Error

#### Create New Blog Post

```http
POST /api/blog
```

Request Headers:

```http
Content-Type: application/json
```

Request Body:

```json
{
	"topic": "string",
	"keywords": ["string", "string"]
}
```

Response:

```json
{
	"success": true,
	"data": {
		"_id": "string",
		"title": "string",
		"content": "string",
		"excerpt": "string",
		"imageUrl": "string",
		"createdAt": "date",
		"updatedAt": "date"
	}
}
```

Status Codes:

- 201: Created
- 400: Bad Request (missing or invalid topic/keywords)
- 500: Server Error

#### Get Single Blog Post

```http
GET /api/blog/[id]
```

Request Headers:

```http
Content-Type: application/json
```

URL Parameters:

- `id`: MongoDB document ID of the blog post

Response:

```json
{
	"success": true,
	"data": {
		"_id": "string",
		"title": "string",
		"content": "string",
		"excerpt": "string",
		"imageUrl": "string",
		"createdAt": "date",
		"updatedAt": "date"
	}
}
```

Status Codes:

- 200: Success
- 404: Blog post not found
- 500: Server Error

#### Update Blog Post

```http
PUT /api/blog/[id]
```

Request Headers:

```http
Content-Type: application/json
```

URL Parameters:

- `id`: MongoDB document ID of the blog post

Request Body:

```json
{
	"title": "string",
	"content": "string",
	"excerpt": "string",
	"imageUrl": "string"
}
```

Response:

```json
{
	"success": true,
	"data": {
		"_id": "string",
		"title": "string",
		"content": "string",
		"excerpt": "string",
		"imageUrl": "string",
		"createdAt": "date",
		"updatedAt": "date"
	}
}
```

Status Codes:

- 200: Success
- 400: Bad Request (invalid update data)
- 404: Blog post not found
- 500: Server Error

## AI Content Generation

The service uses OpenAI's GPT-4 Turbo to generate blog content with the following structure:

- Engaging title
- Well-structured content with introduction, main points, and conclusion
- Brief excerpt (max 200 characters)
- Content formatted in markdown

### Image Generation

DALL-E 3 is used to generate high-quality images (1024x1024) based on the blog content.

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

Error Response Format:

```json
{
	"error": "Error message"
}
```

## 🏗️ Recent Updates

- Enhanced AI-powered content generation using GPT-4 Turbo for blog posts.
- Automatic high-quality image generation with DALL-E 3.
- Improved error handling and response formats for all endpoints.
- Updated deployment and environment setup instructions for production readiness.

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

## Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Technologies Used

- Next.js 14
- TypeScript
- MongoDB with Mongoose
- OpenAI API (GPT-4 Turbo and DALL-E 3)
- Tailwind CSS
- ESLint
