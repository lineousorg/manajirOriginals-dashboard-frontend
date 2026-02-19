# User Guide - Manajir Originals Admin Panel

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [Features & User Flows](#features--user-flows)

---

## Getting Started

### Login
1. Navigate to `/admin/login`
2. Enter your admin credentials (email and password)
3. Click "Login" to access the dashboard
4. Upon successful login, you'll be redirected to the Dashboard

### Navigation
- Use the **Sidebar** on the left to navigate between sections
- The sidebar can be collapsed/expanded using the toggle button at the bottom

---

## User Roles

### Admin Users
- Full access to all features
- Can manage products, categories, attributes, orders, and users

---

## Features & User Flows

### 1. Dashboard
**Path:** `/admin/dashboard`

**Features:**
- View business overview and key metrics
- See recent orders, total products, categories, and revenue
- Quick stats cards showing important information

---

### 2. Products Management
**Path:** `/admin/products`

**Actions:**
| Action | Description |
|--------|-------------|
| View Products | See all products in a table with image, name, category, price, stock |
| Search | Search products by name |
| Add Product | Create a new product with variants |
| Edit Product | Update existing product details |
| Delete Product | Remove a product from the catalog |

**Add Product Flow:**
1. Click "Add Product" button
2. Fill in basic info: Name, Description, Slug
3. Select Category from dropdown
4. Add Variants:
   - Enter SKU (auto-generated)
   - Set Price and Stock
   - Select Attributes (Color, Size, etc.)
5. Upload Product Images
6. Click "Create" to save

---

### 3. Categories Management
**Path:** `/admin/categories`

**Actions:**
| Action | Description |
|--------|-------------|
| View Categories | See all categories in a hierarchical table |
| Search | Search categories by name |
| Add Category | Create a new category (can set parent) |
| Edit Category | Update category name/slug |
| Delete Category | Remove a category |
| Expand | Click expand icon to see subcategories |

**Category Hierarchy:**
- Categories can have parent-child relationships
- Expand a category row to see its children

---

### 4. Attributes Management ⚡ NEW
**Path:** `/admin/attributes`

**What are Attributes?**
Attributes define product characteristics like Color, Size, Material, etc.

**Actions:**
| Action | Description |
|--------|-------------|
| View Attributes | See all attributes in a table |
| Search | Search attributes by name |
| Add Attribute | Create a new attribute (e.g., "Color", "Size") |
| Edit Attribute | Update attribute name |
| Delete Attribute | Remove attribute (also deletes all values) |
| View Values | Expand row to see values for that attribute |
| Manage Values | Click "Manage Values" to go to values page |

---

### 5. Attribute Values Management ⚡ NEW
**Path:** `/admin/attribute-values`

**What are Attribute Values?**
Values are the options for each attribute (e.g., "Red", "Blue" for Color)

**Actions:**
| Action | Description |
|--------|-------------|
| View Values | See all attribute values in a table |
| Search | Search by value name or attribute name |
| Filter | Filter values by specific attribute |
| Add Value | Create a new value for an attribute |
| Edit Value | Update value name |
| Delete Value | Remove a value |

**Add Value Flow:**
1. Click "Add Value" button
2. Select the Attribute (e.g., Color)
3. Enter the Value (e.g., Red)
4. Click "Create"

---

### 6. Orders Management
**Path:** `/admin/orders`

**Actions:**
| Action | Description |
|--------|-------------|
| View Orders | See all orders in a table |
| Search | Search orders by ID or customer info |
| View Details | Click an order to see full details |
| Update Status | Change order status (Pending → Processing → Shipped → Delivered) |
| View Customer | See customer shipping/billing info |

**Order Statuses:**
- `Pending` - Order placed, awaiting processing
- `Processing` - Order being prepared
- `Shipped` - Order has been shipped
- `Delivered` - Order delivered to customer
- `Cancelled` - Order cancelled

---

### 7. Users Management
**Path:** `/admin/users`

**Actions:**
| Action | Description |
|--------|-------------|
| View Users | See all registered users |
| Search | Search users by name or email |
| View Details | Click to see user information |

---

## Quick Reference

### Keyboard Shortcuts
- Press `Enter` in forms to submit
- Use `Escape` to close dialogs/modals

### Common UI Elements
- **Buttons:** Primary actions (Create, Save) | Secondary (Cancel, Back)
- **Dropdowns:** Click to select options
- **Tables:** Sortable columns, expandable rows
- **Dialogs:** Modal windows for forms
- **Toasts:** Success/error notifications (bottom-right)

### Tips
1. **Auto-generated SKU:** When adding product variants, SKU is automatically created based on product name and selected attributes
2. **Attribute Filtering:** In Attribute Values page, filter by attribute to quickly find specific values
3. **Category Hierarchy:** Use parent categories to organize products logically
4. **Image Upload:** Drag & drop or click to upload product images

---

## Support

For issues or questions, contact the development team.
