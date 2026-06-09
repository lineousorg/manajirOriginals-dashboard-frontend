# Frontend Implementation Plan: Category Attribute Value Restriction

## Overview
This document outlines the 4-phase implementation plan for adding value restriction modes (ALL, SELECTED, NONE) to category attributes in the frontend. Each phase must be completed and approved before moving to the next.

## Phase 1: Type Definitions Update - COMPLETED
**File:** `src/types/attribute.ts`
**Objective:** Update DTO interfaces to include valueRestrictionMode and valueIds fields
**Changes Made:**
- Added `valueRestrictionMode?: 'ALL' | 'SELECTED' | 'NONE'` to CreateCategoryAttributeInput
- Added `valueIds?: number[]` to CreateCategoryAttributeInput
- Added `valueRestrictionMode?: 'ALL' | 'SELECTED' | 'NONE'` to UpdateCategoryAttributeInput
- Added `valueIds?: number[]` to UpdateCategoryAttributeInput
- Updated CategoryAttribute interface to include these fields for response handling

**Status:** COMPLETED ✅

## Phase 2: Hooks Update - COMPLETED
**File:** `src/hooks/useCategoryAttributes.ts`
**Objective:** Update hook to handle new fields in category attribute data
**Changes Made:**
- Updated the UseCategoryAttributesReturn interface to include valueRestrictionMode and valueIds in attributesWithSettings
- Updated the attributesWithSettings mapping to include valueRestrictionMode and valueIds from fetched data
- Maintained backward compatibility with existing fields

**Status:** COMPLETED ✅

## Phase 3: API Service Verification - COMPLETED
**File:** `src/services/api.ts`
**Objective:** Verify API service functions work with updated DTOs
**Verification Completed:**
- The `assignAttribute` function (lines 237-243) takes `data: CreateCategoryAttributeInput` and sends it via POST
- The `updateCategoryAttribute` function (lines 255-265) takes `data: UpdateCategoryAttributeInput` and sends it via PATCH
- Since these functions use the updated DTO types from "@/types/attribute", they will automatically include the new `valueRestrictionMode` and `valueIds` fields when present in the data objects
- No changes needed to the API service functions themselves - they work correctly with the updated types

**Status:** COMPLETED ✅

## Phase 4: UI Components Update - IN PROGRESS
**File:** `src/app/admin/categories/page.tsx` (and related components)
**Objective:** Update attribute assignment UI to control value restriction modes
**Changes Needed:**
- Add value restriction mode selector (ALL/SELECTED/NONE) in attribute assignment modal
- When SELECTED mode is chosen, show attribute value selection controls
- When ALL or NONE is chosen, hide value selection controls
- Update handleSaveAttributes to include valueRestrictionMode and valueIds in input objects
- Update display of category attributes to show restriction mode and selected values
- Reuse existing components like AttributeSelectionTable where appropriate for value selection

**Status:** IN PROGRESS ⏳

## Implementation Notes:
1. Each phase must be completed and approved before proceeding to the next
2. No duplicate logic - reuse existing patterns and components
3. No breaking changes to currently working system
4. No silent bugs - all changes will be tested and visible
5. Keep implementations simple and clean - follow existing code patterns
6. If any phase reveals unexpected complexity, stop and reassess before proceeding

## Approval Process:
After completing each phase, I will report what was done and wait for your "yes" before starting the next phase.