# Category Attribute Assignment - Admin User Guide

## Overview

This guide explains how to assign attributes to categories and how they connect to product creation/editing.

---

## Step 1: Create Attributes First

**Before assigning attributes to categories, you must create them.**

1. Go to **Admin > Attributes**
2. Click **Add Attribute**
3. Enter an attribute name (e.g., "Color", "Size", "Material")
4. Add values for each attribute (e.g., for "Color": Red, Blue, Green)

> **Note:** Attributes without values cannot be used for product variants.

---

## Step 2: Assign Attributes to a Category

1. Go to **Admin > Categories**
2. Find the category you want to configure
3. Click the **Manage Attributes** button for that category
4. The modal shows all available attributes

### For Each Attribute, Set These Options:

| Option | What it does |
|--------|--------------|
| **Variant** | If checked, this attribute creates different product versions (e.g., Red-Shirt and Blue-Shirt are different variants) |
| **Required** | If checked, products in this category must have a value selected for this attribute |
| **Order** | Number controlling display order (lower numbers appear first) |
| **Restriction** | Controls which attribute values are available: |
| | - **All**: All values are available |
| | - **Selected**: Only chosen values are available (click "Select values" to pick) |
| | - **None**: No values available (attribute disabled) |

5. Check **Variant** and/or **Required** to enable the attribute for this category
6. Click **Save Changes**

---

## Step 3: Create or Edit Products

When creating or editing a product:

1. **Select a Category** in the product form
2. Only attributes assigned to that category will appear in the **Variants** section
3. For each variant, select values from the available attributes
4. Required attributes must have a value selected before saving

> **Important:** If no attributes appear, check that the category has attributes assigned in Step 2.

---

## How It Works

```
Attributes (Color, Size) 
    ↓
Assigned to Category (T-Shirts)
    ↓
Available for Products in that Category
    ↓
Variants are created (Red/Large, Blue/Medium, etc.)
```

- Attributes assigned to a parent category are NOT automatically inherited by child categories
- Each category must have its attributes configured separately
- Changing attribute assignments affects only new product variants, not existing products