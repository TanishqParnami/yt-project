🎬 Video Streaming Backend API
This is a scalable backend for a video streaming platform (similar to YouTube), built using Node.js, Express.js, and MongoDB.
It supports video uploads, user authentication, playlists, subscriptions, and more.

🛠️ Tech Stack
Node.js
Express.js
MongoDB + Mongoose
JWT Authentication
Cloudinary (video & image storage)
Multer (file uploads)
REST API

📁 Project Structure
src/
│── controllers/        # Business logic (videos, users, playlists)
│── models/             # Mongoose schemas
│── routes/             # API routes
│── middlewares/        # Auth & error handling
│── utils/              # Helpers (ApiError, ApiResponse, asyncHandler)
│── config/             # DB & cloud configs
│── app.js              # Express app setup
│── server.js           # Entry point

⚙️ Installation & Setup
1. Clone the repo
git clone https://github.com/your-username/video-streaming-backend.git
cd video-streaming-backend
2. Install dependencies
npm install
3. Environment Variables


Create a .env file:
PORT=5000
MONGODB_URI=your_mongodb_uri
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx


▶️ Running the Server
npm run dev


🔑 Core Features
👤 Authentication
User registration & login
JWT-based authentication (access + refresh tokens)
Secure logout

🎥 Video Management
Upload videos (Cloudinary integration)
Get all videos (pagination, search, sorting)
Get video by ID
Delete video
Update video details

📺 Channel System
User channels
Subscribe / unsubscribe to channels
Subscriber count

📂 Playlists
Create playlist
Add/remove videos
Fetch user playlists

❤️ Engagement
Like / dislike videos
View count tracking


📡 API Endpoints (Sample)
🔐 Auth Routes
POST /api/v1/users/register
POST /api/v1/users/login
POST /api/v1/users/logout
POST /api/v1/users/refresh-token
🎥 Video Routes
GET    /api/v1/videos
POST   /api/v1/videos/upload
GET    /api/v1/videos/:videoId
DELETE /api/v1/videos/:videoId
PATCH  /api/v1/videos/:videoId
📂 Playlist Routes
POST   /api/v1/playlists
GET    /api/v1/playlists/:playlistId
PATCH  /api/v1/playlists/:playlistId
DELETE /api/v1/playlists/:playlistId
📺 Subscription Routes
POST /api/v1/subscriptions/:channelId
GET  /api/v1/subscriptions/user/:userId
🔒 Authentication Flow
User logs in → receives:
Access Token (short-lived)
Refresh Token (long-lived)

Protected routes require:

Authorization: Bearer <access_token>
Refresh token used to generate new access token


🧪 Testing
Use:
Postman
Thunder Client


🧰 Scripts
npm run dev     # Development (nodemon)
npm start       # Production


🧠 Key Concepts Used
MVC Architecture
RESTful API Design
Aggregation Pipelines (MongoDB)
Middleware-based auth system
File handling & cloud storage

-[Model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)
