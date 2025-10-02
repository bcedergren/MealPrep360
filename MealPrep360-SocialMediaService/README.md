# MealPrep360 Social Media Service

A social media service component for the MealPrep360 platform, built with Next.js 15 and MongoDB.

## Features

- User profiles and authentication via Clerk
- Social interactions (posts, comments, likes)
- Real-time notifications
- Follow/unfollow functionality
- Rate limiting and error handling

## Tech Stack

- **Framework**: Next.js 15.3.2
- **Authentication**: Clerk
- **Database**: MongoDB with Mongoose
- **Real-time**: WebSocket
- **Form Handling**: React Hook Form with Zod validation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- MongoDB instance
- Clerk account and API keys

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
WEBSOCKET_URL=ws://localhost:8080
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/MealPrep360-SocialMediaService.git
cd MealPrep360-SocialMediaService
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

## API Endpoints

### User Routes

- `GET /api/users/[userId]` - Get user profile
  - **Response:** User profile object
    ```json
    {
      "userId": "string",
      "displayName": "string",
      "bio": "string",
      "profilePicture": "string",
      "privacySettings": {
        "isProfilePublic": boolean,
        "isMealPlansPublic": boolean
      }
    }
    ```
- `PATCH /api/users/[userId]` - Update user profile
  - **Request Body:** User profile object
    ```json
    {
      "displayName": "string",
      "bio": "string",
      "profilePicture": "string",
      "privacySettings": {
        "isProfilePublic": boolean,
        "isMealPlansPublic": boolean
      }
    }
    ```
  - **Response:** Updated user profile object
- `POST /api/users/[userId]/follow` - Follow a user
  - **Response:** Success message
- `DELETE /api/users/[userId]/follow` - Unfollow a user
  - **Response:** Success message

### Post Routes

- `GET /api/social/posts` - Get all posts
  - **Response:** List of posts
    ```json
    [
    	{
    		"postId": "string",
    		"authorId": "string",
    		"content": "string",
    		"createdAt": "string",
    		"updatedAt": "string"
    	}
    ]
    ```
- `POST /api/social/posts` - Create a new post
  - **Request Body:** Post object
    ```json
    {
    	"content": "string"
    }
    ```
  - **Response:** Created post object
- `GET /api/social/posts/[postId]` - Get a specific post
  - **Response:** Post object
- `PATCH /api/social/posts/[postId]` - Update a post
  - **Request Body:** Post object
    ```json
    {
    	"content": "string"
    }
    ```
  - **Response:** Updated post object
- `DELETE /api/social/posts/[postId]` - Delete a post
  - **Response:** Success message

### Comment Routes

- `GET /api/social/posts/[postId]/comments` - Get post comments
  - **Response:** List of comments
    ```json
    [
    	{
    		"commentId": "string",
    		"postId": "string",
    		"authorId": "string",
    		"content": "string",
    		"createdAt": "string",
    		"updatedAt": "string"
    	}
    ]
    ```
- `POST /api/social/posts/[postId]/comments` - Add a comment
  - **Request Body:** Comment object
    ```json
    {
    	"content": "string"
    }
    ```
  - **Response:** Created comment object
- `DELETE /api/social/posts/[postId]/comments` - Delete a comment
  - **Response:** Success message

### Like Routes

- `POST /api/social/posts/[postId]/like` - Like a post
  - **Response:** Success message
- `DELETE /api/social/posts/[postId]/like` - Unlike a post
  - **Response:** Success message

### WebSocket Gateway

- `GET /api/websocket` - Get WebSocket server URL
  - **Response:** WebSocket server URL

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The build process will create an optimized production build in the `.next` directory.

## Error Handling

The service includes comprehensive error handling with custom error types:

- `NotFound` (404)
- `Unauthorized` (401)
- `Forbidden` (403)
- `BadRequest` (400)
- `ValidationError` (400)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏗️ Recent Updates

- Expanded API endpoints for posts, comments, likes, and real-time notifications.
- Added WebSocket support for real-time social features.
- Improved error handling with custom error types and responses.
- Enhanced security with Clerk authentication and rate limiting.
