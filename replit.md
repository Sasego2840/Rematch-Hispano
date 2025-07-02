# Rematch Liga Española - Tournament Management Platform

## Overview

Rematch Liga Española is a web application designed for managing gaming competitions for the Rematch video game. The platform provides tournament and league management features with Discord authentication, team management, match scheduling, and administrative controls.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React Context for authentication
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling (new-york style)

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with Discord OAuth2 strategy
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time Communication**: WebSocket server for live notifications

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema**: Relational database with tables for users, teams, tournaments, leagues, matches, and notifications
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- **Primary Method**: Discord OAuth2 integration for user login
- **Admin Access**: Separate admin authentication with hardcoded credentials (Latinogang/Ligaesp2840)
- **Role-based Access**: Three user roles - user, captain, admin
- **Session Persistence**: Server-side sessions with PostgreSQL storage

### Team Management
- **Team Creation**: Captain-level users can create and manage teams
- **Platform Support**: PC, Steam, Xbox, Gamepass platform options
- **Invitation System**: Team captains can invite users via in-app notifications
- **Member Management**: Add/remove team members with appropriate permissions

### Tournament & League System
- **Tournament Structure**: Bracket-based tournaments with configurable team limits
- **League System**: Point-based leagues with customizable scoring rules
- **Match Management**: Scheduled matches with status tracking (pending, completed, cancelled, postponed)
- **Admin Controls**: Full administrative control over tournament/league creation and management

### Notification System
- **Real-time Updates**: WebSocket-based live notifications
- **Notification Types**: Team invitations, match schedules, tournament updates
- **Persistence**: Database-stored notifications with read/unread status

### Calendar & Scheduling
- **Match Calendar**: Visual calendar interface for viewing scheduled matches
- **Admin Scheduling**: Administrative tools for setting match dates and times
- **Status Management**: Match result recording and point allocation

## Data Flow

1. **User Authentication**: Discord OAuth → User creation/login → Session establishment
2. **Team Operations**: Captain creates team → Sends invitations → Members join → Team participates in competitions
3. **Competition Flow**: Admin creates tournament/league → Teams register → Matches scheduled → Results recorded → Points/rankings updated
4. **Real-time Updates**: Server events → WebSocket broadcast → Client notification display

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon Database connectivity
- **drizzle-orm**: Database ORM and query builder
- **express**: Web framework
- **passport**: Authentication middleware
- **ws**: WebSocket implementation

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI component primitives
- **react-hook-form**: Form management
- **zod**: Schema validation
- **wouter**: Lightweight routing

### Development Tools
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database schema management

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite dev server with HMR
- **API Server**: Express server with tsx for TypeScript execution
- **Database**: Neon serverless PostgreSQL
- **Real-time**: Integrated WebSocket server

### Production Build
- **Frontend**: Vite build process generating static assets
- **Backend**: ESBuild bundling for Node.js deployment
- **Database**: Neon production database with connection pooling
- **Environment**: NODE_ENV-based configuration switching

### Configuration Requirements
- **DATABASE_URL**: Neon database connection string
- **DISCORD_CLIENT_ID**: Discord application client ID
- **DISCORD_CLIENT_SECRET**: Discord application secret
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Allowed domains for development

## Changelog

```
Changelog:
- July 02, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```