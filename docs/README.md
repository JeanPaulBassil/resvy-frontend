# Reservations Frontend Documentation

## Overview

This document provides an overview of the Reservations Frontend, a Next.js-based web application that provides a user interface for managing reservations, user access, and other related functionality.

## System Architecture

The Reservations Frontend is built using:

- **Next.js**: React framework for server-side rendering and static site generation
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Firebase**: Authentication and real-time database
- **SWR**: React Hooks for data fetching

## Core Features

### 1. Authentication System

The authentication system handles user login, registration, and access control:

- **Firebase Authentication**: Used for user identity verification
- **Role-Based Access Control**: Different user roles have different access levels
- **Protected Routes**: Certain routes are only accessible to authenticated users or specific roles
- **Email Allowlist**: Integration with backend to ensure only allowed emails can register

### 2. Reservation Management

The reservation management system allows users to create, view, update, and delete reservations:

- **Calendar View**: Visual representation of reservations
- **Reservation Forms**: Forms for creating and updating reservations
- **Filtering and Sorting**: Tools for finding specific reservations
- **Status Tracking**: Monitoring the status of reservations

### 3. User Management

The user management system allows administrators to manage user accounts:

- **User List**: View all users in the system
- **User Details**: View and edit user information
- **Role Assignment**: Assign roles to users
- **Email Allowlist Management**: Control which emails can register

## Directory Structure

```
frontend/
├── components/        # Reusable React components
│   ├── auth/          # Authentication-related components
│   ├── layout/        # Layout components (header, footer, etc.)
│   ├── reservation/   # Reservation-related components
│   └── ui/            # UI components (buttons, inputs, etc.)
├── contexts/          # React contexts for state management
├── hooks/             # Custom React hooks
├── pages/             # Next.js pages
│   ├── api/           # API routes
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Dashboard pages
│   └── reservations/  # Reservation pages
├── public/            # Static assets
├── styles/            # Global styles
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Recent Changes

### Added Email Allowlist Integration (June 2023)

1. **Authentication Flow Update**:
   - Updated login and registration to check if email is allowed
   - Added error handling for unauthorized emails

2. **Admin Interface**:
   - Added interface for managing allowed emails
   - Implemented CRUD operations for allowed emails

3. **Role-Based Access Control**:
   - Enhanced RBAC system to support the new email allowlist feature
   - Updated protected routes to use the new access control system

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn package manager
- Firebase project

### Environment Setup

1. Copy `.env.example` to `.env.local` and configure environment variables
2. Set up Firebase configuration in `.env.local`

### Starting the Development Server

```bash
npm run dev
# or
yarn dev
```

## Deployment

The application can be deployed using Vercel, Netlify, or any other Next.js-compatible hosting service:

```bash
npm run build
npm run start
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Ensure Firebase configuration is correct
   - Check that the user's email is in the allowed emails list
   - Verify that the backend API is accessible

2. **API Connection Issues**:
   - Check that the API URL is correctly configured in `.env.local`
   - Ensure the backend server is running
   - Verify network connectivity between frontend and backend

3. **Rendering Issues**:
   - Clear browser cache and reload
   - Check for JavaScript console errors
   - Ensure all dependencies are installed correctly
