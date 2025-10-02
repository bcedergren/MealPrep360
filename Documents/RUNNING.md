🚀 MealPrep360 - Running the Full Stack
Services Overview
Your application stack includes:

Service Port URL Description
Frontend 3000 http://localhost:3000 Main Next.js application
Admin Panel 3008 http://localhost:3008 Admin dashboard
API Gateway 3001 http://localhost:3001 Central API gateway
Recipe Service 3002 http://localhost:3002 Recipe management
Meal Plan Service 3003 http://localhost:3003 Meal planning
Shopping Service 3004 http://localhost:3004 Shopping lists
Social Service 3005 http://localhost:3005 Social features
Blog Service 3006 http://localhost:3006 Blog/content
WebSocket Server 3007 ws://localhost:3007 Real-time features
MongoDB 27017 mongodb://localhost:27017 Database
Redis 6379 redis://localhost:6379 Cache/sessions
Commands Reference
Start the application:
View logs (all services):
View logs (specific service):
Check service health:
Stop the application:
Restart a specific service:
Rebuild and restart (after code changes):
Clean shutdown and remove volumes:
Access Points
✅ All services are currently healthy and running!

Main App: http://localhost:3000
Admin Panel: http://localhost:3008
API Health Check: http://localhost:3001/api/health
Development Workflow
Make code changes in any service directory
Rebuild specific service:
View logs to debug:
Troubleshooting
Service unhealthy? Check logs: docker compose logs [service-name]
Port conflicts? Stop other applications using these ports
Database issues? MongoDB is configured with authentication (admin/devStrongPass!123)
Environment issues? Ensure your .env file has all required variables
The stack is now fully operational with all healthchecks passing! 🎉
