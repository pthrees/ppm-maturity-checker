# PPM Maturity × Impact Diagnostic Web Application

## Overview

This is a Japanese-language diagnostic web application that helps SIer/IT vendor management assess their organization's Project Portfolio Management (PPM) maturity level and identify priority improvement areas. Users answer 12 questions across 4 categories, selecting both a maturity level (0-3) and importance rating (1-3) for each. The application calculates scores, visualizes results through charts (radar, scatter plots), and provides actionable feedback based on company size context.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state, React Hook Form for form state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth transitions between questions and result animations
- **Charts**: Recharts for radar charts and data visualizations
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Pattern**: REST endpoints defined in shared route contracts with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Data Flow
1. User completes 12-question assessment form
2. Assessment data is validated client-side with Zod schemas
3. POST request saves assessment to PostgreSQL database
4. User selects company size on pre-result page (stored in localStorage)
5. Result page fetches assessment data and renders visualizations with company-size-aware feedback

### Shared Code Architecture
- `shared/schema.ts`: Database table definitions and Zod validation schemas
- `shared/routes.ts`: API contract definitions with input/output types
- Both client and server import from shared directory for type safety

### Key Design Decisions
- **Monorepo Structure**: Client, server, and shared code in single repository with path aliases (`@/`, `@shared/`)
- **Type-Safe API**: Zod schemas shared between client and server ensure runtime validation matches TypeScript types
- **Component Library**: Full shadcn/ui installation provides consistent, accessible UI components
- **Japanese Localization**: Noto Sans JP font and Japanese text throughout the application

## External Dependencies

### Database
- **PostgreSQL**: Primary data store via `DATABASE_URL` environment variable
- **Drizzle Kit**: Schema migrations with `db:push` command
- **connect-pg-simple**: Session storage (available but sessions not currently implemented)

### UI/Visualization Libraries
- **Radix UI**: Accessible primitive components (dialog, popover, tabs, etc.)
- **Recharts**: Data visualization for assessment results
- **Framer Motion**: Page transitions and micro-animations
- **Lucide React**: Icon library

### Form & Validation
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation shared across client/server
- **@hookform/resolvers**: Zod integration with React Hook Form

### Build & Development
- **Vite**: Frontend bundling with HMR
- **esbuild**: Server bundling for production
- **TSX**: TypeScript execution for development server