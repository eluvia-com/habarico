# Copilot Instructions

**Habarico** is a React-based web application that allows users to create and manage information systems (or CMS).  
The main goal is to generate CRUD views according to schema definitions provided by a web server.

## Architecture & Libraries

- The application is built using **React** and **TypeScript**.
- It is based on the `react-admin` library, which provides a set of components for building admin interfaces.
- We use **functional components** and prefer **hooks over class components**.
- Each object exposed via the API is called a **resource**. A resource provides standard CRUD operations (Create, Read, Update, Delete) and may include **custom actions**.
- Resources expose a schema for both list and detail endpoints. The schema:
  - Defines supported HTTP methods.
  - Describes available views and actions.
  - Is inspired by the OpenAPI specification.

## Coding Conventions

- All code must be written in **TypeScript**.
- Follow **functional programming principles** where possible (immutability, pure functions).
- We use **Prettier** and **ESLint** with standard configurations to enforce consistent code formatting and linting rules.
- Use **async/await** for asynchronous operations.

## Project Management

- We use **YouTrack** for issue tracking and project management.
- Branch names and commits should reference the related YouTrack issue (e.g., `HAB-123`).

## API & Networking

- API schemas are dynamic and may differ between environments.
- Always handle unknown fields gracefully — prefer flexible rendering where possible.
- Use `fetch` or libraries like `react-query` to manage network requests and caching.

## UI Guidelines

- Follow accessibility best practices (ARIA roles, labels, keyboard navigation).
- Design UI components to be reusable and composable.
- Avoid hardcoding text strings — use internationalization (`i18n`) when applicable.

## Folder Structure

src/
├── components/ # Shared UI components
├── contexts/ # Context providers
├── hooks/ # Custom React hooks
├── utils/ # Utility functions
├── index.tsx # Entry point for the library
└── types.tsx # Base type definitions
