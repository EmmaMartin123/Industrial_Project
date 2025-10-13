# Industrial Project - Elevare

## Overview
This platform connects Businesses with potential investors. It allows businesses to create investment pitches and investors to browse, fund, and track returns from these opportunities.

## System Architecture
- **Backend**: Go-based RESTful API server with JWT authentication
- **Frontend**: Next.js with TypeScript, Tailwind CSS and custom UI components
- **Database**: PostgreSQL via Supabase
- **Storage**: S3 Bucket on Supabase

## Features

### For Businesses
- Create and manage investment pitches with detailed descriptions
- Configure investment tiers with different multipliers for returns
- Upload media files to enhance pitch presentations
- Declare profits and distribute them to investors
- Monitor funding progress and track investor engagement

### For Investors
- Browse available investment opportunities with filtering options
- Invest in promising business ideas with various tier options
- View and manage investment portfolio
- Track returns and profit distributions
- Deposit and withdraw funds between bank and platform wallet

## Backend API Endpoints

### Authentication
- Protected routes using JWT middleware
- Role-based access control (business/investor)

### Profile Management
- `/api/profile`: User profile creation and management

### Pitch Management
- `/api/pitch`: CRUD operations for business pitches
- `/api/pitch/status`: Update pitch status

### Investment Operations
- `/api/investment`: Create and manage investments
- `/api/portfolio`: View investment portfolio

### Financial Operations
- `/api/wallet`: Platform wallet management
- `/api/bank`: Bank account integration
- `/api/profit`: Profit declaration
- `/api/distribute`: Profit distribution to investors