# Admin User Guide: Edit Product Page

## Before You Start

1. **Select a category** first to see available variant attributes
2. **Wait for the page to fully load** before making changes
3. **Click "Save Changes"** at the bottom to apply all modifications

---

## Sections Overview

The page has 4 main sections:
- **Basic Information** - Product name, description, details, category
- **Product Variants** - Price, stock, and attribute combinations
- **Product Images** - Upload and manage product photos
- **Actions** - Save or cancel changes

---

## Basic Information

| Field | Rule |
|-------|------|
| Product Name | Required. Max 100 characters |
| Description | Required. Max 500 characters |
| Product Details | Optional. Rich text editor for detailed info |
| Category | Required. Select from dropdown |

**Active Status Toggle** (top right)
- **ON**: Product is visible to customers
- **OFF**: Product is hidden from customers

---

## Product Variants

### Adding a Variant

1. Click **"Add Variant"** button
2. A new variant card appears at the top (auto-expanded)
3. Fill in **Price**, **Stock**, and select **attribute values**
4. **SKU is auto-generated** based on: `{ProductAbbreviation}-{Attribute1Code}-{Attribute2Code}-...-{Index}`

### Variant Actions

| Action | Who Can Do It | What Happens |
|--------|--------------|--------------|
| Delete variant | All variants | Removes from form. **Must save** to confirm. Existing variants hidden immediately, new variants removed instantly |
| Toggle Active (ON/OFF switch) | Existing variants only | Immediately activates/deactivates variant. No save needed |
| Edit fields | All variants | Changes saved when you click **"Save Changes"** |

### Important Rules

- **At least one variant must exist** - Cannot delete all variants
- **No duplicate variants** - Cannot have two variants with identical attributes
- **Price** must be 0 or higher
- **Stock** must be 0 or higher

### Existing vs. New Variants

| Feature | Existing Variant | New Variant |
|---------|-----------------|------------|
| Attributes | Read-only (locked) | Editable (dropdown) |
| Active Toggle | Yes (immediate) | No |
| Delete | Immediate removal from view | Immediate removal from view |

---

## Product Images

### Adding Images

1. Click **"Add Images"** button
2. Select one or more image files
3. Images upload to Cloudinary (spinner shows progress)
4. After upload completes, image appears in grid

### Removing Images

| Image Type | Can Remove? | When Actually Deleted |
|------------|-------------|---------------------|
| Existing (already saved) | Yes | **When you click "Save Changes"** |
| New (just uploaded) | Yes | Immediately |

### Rules

- **All images can be removed** - no restrictions
- **Alt text** is optional - helps with SEO/accessibility
- **Uploads fail silently** - shows "Upload failed" message if error occurs
- Remove failed uploads manually before saving

---

## Discounts (Per Variant)

Each variant has an optional discount section.

### Setup

1. Click the discount row to expand
2. Select discount **Type**: Percentage or Fixed (BDT)
3. Enter **Value**
4. Set **Start** and **End** dates (optional, must be today or future)

### Validation Rules

| Type | Max Value | Error Message |
|------|-----------|---------------|
| Percentage | 100% | "Percentage cannot exceed 100" |
| Fixed | Price amount | "Fixed discount cannot exceed product price" |

### Dates

- Start date: Any date from today onward
- End date: Must be on or after start date

---

## Saving Changes

1. Click **"Save Changes"** button
2. System checks what changed and sends only those updates

### What Happens on Save

- Basic info changes: Updated immediately
- Deleted variants: Removed permanently
- New variants: Created with assigned IDs
- New images: Added to product
- Removed images: Deleted permanently

### If Nothing Changed

- Message: "No changes" (no save happens)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Variant already exists" | You have two variants with same attributes. Change one or remove duplicates |
| "Percentage cannot exceed 100" | Discount percentage must be 0-100 |
| "Fixed discount cannot exceed price" | Discount amount must be less than variant price |
| Upload failed | Check internet connection and try again. Remove failed upload before saving |
| Cannot delete last variant | Keep at least one variant. Add another before deleting if needed |

**NOTE**
Not all the categories has assigned attributes. So if random product is being tried to edited, an error can be shown 
Error: **Variant 174: Attribute 2 is not applicable to this product's category**
That means that products category has not been assigned the attribute values yet. Assign the values from category page and you are good to go.

For testing use this products for now or add your selected products category those attributes and it will be find. Use the **THE HERITAGE CLASSIC** line product. This cateogry has its attributes assigned