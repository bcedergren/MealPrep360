# MealPrep360 - Complete Application Documentation

Welcome to the comprehensive documentation for the MealPrep360 ecosystem. This repository contains all the documentation you need to understand, develop, and maintain the MealPrep360 application.

## 📚 Documentation Index

### 🎯 Core Documentation
- **[Comprehensive Application Documentation](./COMPREHENSIVE_APPLICATION_DOCUMENTATION.md)** - Complete overview of the entire application
- **[Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)** - Visual representation of system architecture
- **[Developer Quick Reference](./DEVELOPER_QUICK_REFERENCE.md)** - Quick start guide for developers

### 🧪 Testing & Quality
- **[Testing Guide](./TESTING_GUIDE.md)** - Comprehensive testing strategy and implementation
- **[Service Communication Setup](./SERVICE_COMMUNICATION_SETUP.md)** - Inter-service communication configuration
- **[Service Communication Solution](./SERVICE_COMMUNICATION_SOLUTION.md)** - Complete solution for service communication

### 🔧 Development & Operations
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[Environment Setup](./ENVIRONMENT_SETUP.md)** - Development environment configuration
- **[Containerization Guide](./CONTAINERIZATION_GUIDE.md)** - Docker and container management
- **[Production Environment Config](./PRODUCTION_ENVIRONMENT_CONFIG.md)** - Production environment setup
- **[Production Build Guide](./PRODUCTION_BUILD_GUIDE.md)** - Production build and optimization
- **[Production Security Guide](./PRODUCTION_SECURITY_GUIDE.md)** - Production security measures
- **[Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)** - Production deployment procedures

## 🚀 Quick Start

### For Developers
1. **Read the [Developer Quick Reference](./DEVELOPER_QUICK_REFERENCE.md)** for immediate setup
2. **Follow the [Comprehensive Documentation](./COMPREHENSIVE_APPLICATION_DOCUMENTATION.md)** for deep understanding
3. **Set up your environment** using the [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
4. **Use Docker Compose** for easy development with [Containerization Guide](./CONTAINERIZATION_GUIDE.md)

### For System Administrators
1. **Review the [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)** for system overview
2. **Configure monitoring** using the [Service Communication Setup](./SERVICE_COMMUNICATION_SETUP.md)
3. **Deploy with Docker** using the [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
4. **Secure the system** with the [Production Security Guide](./PRODUCTION_SECURITY_GUIDE.md)

### For Testers
1. **Read the [Testing Guide](./TESTING_GUIDE.md)** for testing strategies
2. **Run the test suite** using the provided test commands
3. **Test containerized services** using Docker Compose

### For DevOps Engineers
1. **Review the [Containerization Guide](./CONTAINERIZATION_GUIDE.md)** for container management
2. **Follow the [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)** for deployment
3. **Configure production environment** using [Production Environment Config](./PRODUCTION_ENVIRONMENT_CONFIG.md)
4. **Optimize builds** with the [Production Build Guide](./PRODUCTION_BUILD_GUIDE.md)

## 🏗️ System Overview

MealPrep360 is a comprehensive AI-powered meal planning platform built with a microservices architecture:

### Core Services
- **Web Application** (Next.js) - Main user interface
- **API Gateway** (Next.js) - Central API service
- **Recipe Service** (Express) - AI-powered recipe management
- **Meal Plan Service** (Next.js) - Meal planning logic
- **Shopping Service** (Express) - Shopping list generation
- **Social Service** (Next.js) - Social features
- **Blog Service** (Next.js) - Content management
- **WebSocket Server** (Node.js) - Real-time features
- **Admin Panel** (Next.js) - Administrative dashboard
- **Mobile App** (React Native) - Mobile application

### Key Features
- 🤖 **AI-Powered Intelligence** - Smart recipe generation and meal planning
- 🍳 **Recipe Management** - Comprehensive recipe database with search and filtering
- 📅 **Meal Planning** - Weekly meal plan generation and calendar management
- 🛒 **Shopping Lists** - Smart shopping list generation from meal plans
- 👥 **Social Features** - Share meal plans and discover new recipes
- 📱 **Multi-Platform** - Web, mobile, and admin applications
- 🌍 **Multi-Language** - Support for 10+ languages

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Native** - Mobile development

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework for microservices
- **MongoDB** - Primary database
- **Redis** - Caching and session storage

### AI & External Services
- **OpenAI GPT-4** - Recipe generation and AI features
- **DALL-E** - AI image generation
- **Clerk** - Authentication and user management
- **Stripe** - Payment processing

## 📊 Current Status

### ✅ Completed Features
- Complete microservices architecture
- AI-powered recipe generation
- Meal planning and calendar system
- Shopping list generation
- Social features and user interactions
- Multi-platform applications (web, mobile, admin)
- Comprehensive testing suite
- Service communication and monitoring
- Authentication and authorization
- Payment processing and subscriptions

### 🧪 Testing Status
- **Unit Tests**: 12/12 passed (100% success rate)
- **API Tests**: 35/35 passed (100% success rate)
- **Performance Tests**: 10/10 passed (100% success rate)
- **Integration Tests**: 6/12 passed (50% success rate)
- **E2E Tests**: Ready for execution

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Required API keys (OpenAI, Clerk, Stripe, etc.)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/MealPrep360.git
cd MealPrep360

# Install dependencies
npm run install:all

# Set up environment variables
cp .env.example .env.local
# Configure your environment variables

# Start all services
npm run dev:all
```

### Service URLs
- **Web App**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Recipe Service**: http://localhost:3002
- **Meal Plan Service**: http://localhost:3003
- **Shopping Service**: https://shopping.mealprep360.com
- **Social Service**: http://localhost:3005
- **Blog Service**: http://localhost:3006
- **WebSocket Server**: http://localhost:3007
- **Admin Panel**: http://localhost:3008

## 🧪 Testing

### Test Commands
```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:api
npm run test:performance

# Test service communication
npm run test:real-communication
```

## 📞 Support & Contributing

### Getting Help
- **Documentation**: Comprehensive guides in this repository
- **GitHub Issues**: Bug reports and feature requests
- **Community**: Discord server for discussions
- **Email**: support@mealprep360.com

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📋 Quick Links

- **[Start Here - Developer Quick Reference](./DEVELOPER_QUICK_REFERENCE.md)**
- **[Complete Documentation](./COMPREHENSIVE_APPLICATION_DOCUMENTATION.md)**
- **[Architecture Overview](./ARCHITECTURE_DIAGRAM.md)**
- **[Testing Guide](./TESTING_GUIDE.md)**
- **[API Reference](./API_DOCUMENTATION.md)**

---

*This documentation is maintained by the MealPrep360 development team and is updated regularly to reflect the current state of the application.*
