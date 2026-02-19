# Manajir Originals - Fashion Admin Panel

A modern, feature-rich admin dashboard for managing fashion products and inventory for Manajir Originals. Built with Next.js 14, TypeScript, and React for a seamless administrative experience.

## 📋 Project Overview

This admin panel provides a comprehensive solution for managing the Manajir Originals fashion business, including:

- **Dashboard**: Overview of key metrics and business insights
- **Product Management**: Create, read, update, and delete products with variants
- **Category Management**: Hierarchical category organization
- **Attribute Management**: Product attributes (Color, Size, Material) and their values
- **Order Management**: Order tracking and status updates
- **User Management**: Admin user management
- **User Authentication**: Secure login system for admin access
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI Components**: Built with shadcn/ui component library

## 🚀 Features

- **Admin Dashboard**: Centralized dashboard for business overview
- **Product CRUD Operations**: Full product lifecycle management with variants
- **Category Management**: Hierarchical category organization
- **Attribute Management**: Manage product attributes and their values (e.g., Color, Size)
- **Order Management**: Track and manage customer orders
- **User Management**: Manage admin users
- **Authentication System**: Secure admin login with context-based state management
- **Responsive Navigation**: Sidebar and navbar for intuitive navigation
- **Rich UI Components**: Pre-built components for alerts, dialogs, forms, tables, and more
- **Type-Safe**: Full TypeScript support for improved code reliability
- **API Integration**: Custom hooks for seamless API communication
- **Customizable Design**: Tailwind CSS for flexible styling

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **HTTP Client**: Custom API hooks with Axios

## 📁 Project Structure

```
manajirOriginals-dashboard-frontend/
├── app/                      # Next.js app directory
│   ├── admin/               # Admin routes
│   │   ├── dashboard/      # Dashboard page
│   │   ├── login/          # Login page
│   │   ├── products/       # Products management
│   │   │   ├── page.tsx    # Products list
│   │   │   ├── add_product/
│   │   │   └── edit_product/[id]/
│   │   ├── categories/     # Category management
│   │   ├── attributes/     # Attribute management
│   │   ├── attribute-values/  # Attribute values management
│   │   ├── orders/         # Order management
│   │   └── users/          # User management
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/
│   ├── layout/             # Layout components (Navbar, Sidebar)
│   └── ui/                # Reusable UI components (shadcn/ui)
├── contexts/               # React contexts (Authentication)
├── hooks/                  # Custom React hooks for API calls
├── services/               # API service layer (Axios)
├── types/                  # TypeScript type definitions
└── lib/                    # Utility functions
```

## 🔑 Key Concepts

### Attributes System

The Attributes feature allows you to define product characteristics and their possible values:

- **Attributes**: Types of characteristics (e.g., "Color", "Size", "Material")
- **Attribute Values**: Possible values for an attribute (e.g., "Red", "Blue" for Color; "S", "M", "L" for Size)

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attributes` | Get all attributes |
| GET | `/attributes/:id` | Get attribute with values |
| POST | `/attributes` | Create new attribute |
| PATCH | `/attributes/:id` | Update attribute |
| DELETE | `/attributes/:id` | Delete attribute (cascades to values) |
| GET | `/attribute-values` | Get all attribute values |
| GET | `/attribute-values/attribute/:attributeId` | Get values for attribute |
| POST | `/attribute-values` | Create new value |
| PATCH | `/attribute-values/:id` | Update value |
| DELETE | `/attribute-values/:id` | Delete value |

### Products with Variants

Products can have multiple variants with different:
- SKU (auto-generated)
- Price
- Stock quantity
- Attributes (e.g., Color: Red, Size: M)

### Custom Hooks

The project uses custom hooks for API communication:

| Hook | Purpose |
|------|---------|
| `useProducts` | Product CRUD operations |
| `useCategories` | Category CRUD operations |
| `useAttributes` | Attribute CRUD operations |
| `useAttributeValues` | Attribute value CRUD operations |
| `useOrders` | Order fetching and status updates |
| `useUsers` | User fetching |

### API Service

All API calls go through `services/api.ts` which:
- Uses Axios for HTTP requests
- Automatically includes auth token from localStorage
- Handles 401 responses (redirects to login)
- Returns typed responses from the backend

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lineousorg/manajirOriginals-frontend.git
cd manajirOriginals-dashboard-frontend
```

2. Install dependencies:
```bash
npm install
```

### Environment Variables

Create a `.env.local` file if needed:
```env
NEXT_PUBLIC_API_URL=https://manajiroriginals.com/api
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🔐 Authentication

The admin panel uses React Context API for authentication state management. Users must log in through the login page to access the dashboard and product management features.

**Authentication Flow:**
1. Admin visits `/admin/login`
2. Enters credentials
3. Backend returns JWT token
4. Token stored in localStorage
5. Token included in all subsequent API requests

## 📦 Dependencies

- **Next.js**: React framework for production
- **React**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Axios**: HTTP client
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **Framer Motion**: Animations
- **Sonner**: Toast notifications

## 🚢 Deployment

The application can be deployed to various platforms:

- **Vercel**: Recommended for Next.js apps
- **Other Node.js Hosting**: AWS, Digital Ocean, Heroku, etc.

## 🤝 Contributing

When adding new features:

1. Follow the existing code patterns
2. Use TypeScript for type safety
3. Add appropriate JSDoc comments
4. Update this README with new features
5. Test thoroughly before committing

## 📄 License

This project is part of the Manajir Originals brand ecosystem.

## 👤 Author

Developed for Manajir Originals
