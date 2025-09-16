# Real Estate Management System

A comprehensive CRM system built with modern technologies for managing real estate operations.

## Tech Stack

### Backend
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **MySQL** - Database

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Paper Free Admin Template** - UI components

## Project Structure

```
project-root/
├── backend/                 # Express + Prisma API
│   ├── src/
│   │   ├── index.ts        # Main server file
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Route controllers
│   │   └── prisma/         # Database client
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL database
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `env.example`):
   ```bash
   cp env.example .env
   ```

4. Update `.env` with your MySQL credentials:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/crm_bavadiya"
   PORT=8080
   NODE_ENV=development
   ```

5. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

6. Push database schema:
   ```bash
   npm run db:push
   ```

7. Start development server:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Features

### Current Implementation
- ✅ Clean project structure
- ✅ Backend API with Express + Prisma
- ✅ Frontend with React + Vite
- ✅ Paper Free Admin template integration
- ✅ Basic routing (Dashboard, Employee List)
- ✅ TypeScript configuration
- ✅ MySQL database setup

### Planned Features
- 🔄 Employee Master Management
- 🔄 Expense Management
- 🔄 Project/Booking Management
- 🔄 Role-based access control
- 🔄 User authentication
- 🔄 Reporting and analytics

## Role-Based Access

The system will support four user roles:
- **System Admin** - Full system access
- **Management** - High-level management access
- **Manager** - Department management access
- **Employee** - Basic user access

## Development

### Backend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Frontend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Keep components clean and minimal
4. Add proper error handling
5. Write meaningful commit messages

## License

This project is proprietary software.
