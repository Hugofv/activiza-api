# Plans, Features, and Authorization System

## Overview

This system implements a flexible plan-based pricing model with feature-based operation limits and multi-currency support. **Plan prices are calculated from the sum of enabled feature prices** - there is no base plan price. Each feature can have prices in multiple currencies, and the total plan price per currency is automatically calculated.

## Architecture

### Core Concepts

1. **Plans**: Subscription tiers that define base pricing and global limits
2. **Features**: Capabilities linked to modules (e.g., loan operations, rental operations)
3. **Plan Features**: Configuration of features within a plan, including:
   - Operation limits per feature
   - Multi-currency pricing
   - Reset periods (MONTHLY, YEARLY, LIFETIME)
4. **Feature Usage**: Tracks operation usage per feature per account

### Database Structure

```
Plan
├── Global limits (maxOperations, maxClients, maxUsers, maxStorage)
├── Billing period (MONTHLY/YEARLY)
└── PlanFeature[]
    ├── Feature reference
    ├── Operation limit (per feature)
    ├── Reset period (MONTHLY/YEARLY/LIFETIME)
    └── PlanFeaturePrice[]
        ├── Currency (BRL, USD, EUR, etc.)
        ├── Price
        └── IsDefault flag

Note: Plan price = Sum of all enabled feature prices per currency

Feature
├── Key (unique identifier)
├── Name
├── Module reference
└── Linked to Plans via PlanFeature

FeatureUsage
├── Account reference
├── PlanFeature reference
├── Operation reference
└── Period tracking (for reset calculations)
```

## Plan Configuration

### Creating a Plan

```json
{
  "name": "Pro Plan",
  "description": "Professional plan with advanced features",
  "billingPeriod": "MONTHLY",
  "isActive": true,
  "isPublic": true,
  "maxOperations": 1000,  // Global limit (optional)
  "maxClients": 500,
  "maxUsers": 10,
  "features": [
    {
      "featureId": 1,
      "isEnabled": true,
      "operationLimit": 10,  // Per feature limit
      "resetPeriod": "MONTHLY",
      "prices": [
        {
          "currency": "BRL",
          "price": 50.00,
          "isDefault": true
        },
        {
          "currency": "USD",
          "price": 10.00,
          "isDefault": false
        }
      ]
    },
    {
      "featureId": 2,
      "isEnabled": true,
      "operationLimit": 5,
      "resetPeriod": "LIFETIME",
      "prices": [
        {
          "currency": "BRL",
          "price": 30.00,
          "isDefault": true
        },
        {
          "currency": "USD",
          "price": 6.00,
          "isDefault": false
        }
      ]
    }
  ]
}

// Calculated Plan Prices:
// BRL: 50.00 + 30.00 = 80.00 (total)
// USD: 10.00 + 6.00 = 16.00 (total)
```

### Plan Feature Configuration

Each feature in a plan can have:

- **operationLimit**: Maximum operations allowed for this feature
  - `null` = unlimited
  - `number` = specific limit
- **resetPeriod**: When usage counters reset
  - `MONTHLY`: Resets each month (e.g., "2024-01", "2024-02")
  - `YEARLY`: Resets each year (e.g., "2024", "2025")
  - `LIFETIME`: Never resets (uses "lifetime" period)
- **prices**: Array of prices per currency
  - Each price has `currency`, `price`, and `isDefault` flag
  - Multiple currencies supported per feature

## Operation Authorization Flow

### 1. Operation Creation Request

When a user attempts to create an operation:

```
POST /api/operations
{
  "accountId": 1,
  "clientId": 1,
  "type": "LOAN",
  "principalAmount": 10000,
  ...
}
```

### 2. Feature Mapping

The system maps operation type to module/feature:

- `LOAN` → `loan` module → loan feature
- `RENTAL` → `rent_room` module (default) → rent_room feature
- Custom mapping via `meta.moduleKey` in operation

### 3. Authorization Checks

The `FeatureAuthorizationService` performs:

1. **Feature Lookup**: Find feature for the operation's module
2. **Plan Feature Check**: Verify account's plan has the feature enabled
3. **Limit Check**: Compare current usage vs. operation limit
4. **Period Calculation**: Determine current period based on reset type

### 4. Usage Tracking

After successful operation creation:

- Creates `FeatureUsage` record
- Links to account, plan feature, and operation
- Stores period for tracking

## Reset Periods

### MONTHLY

- Period format: `YYYY-MM` (e.g., "2024-01", "2024-02")
- Usage resets at the start of each month
- Example: 10 operations/month, resets on 1st of each month

### YEARLY

- Period format: `YYYY` (e.g., "2024", "2025")
- Usage resets at the start of each year
- Example: 100 operations/year, resets on January 1st

### LIFETIME

- Period format: `"lifetime"`
- Usage never resets
- Example: 50 operations total, ever

## Pricing Model

### Feature-Only Pricing

**Plan prices are calculated automatically from enabled features.** There is no base plan price. The total plan price per currency is the sum of all enabled feature prices in that currency.

### Multi-Currency Support

Each plan feature can have prices in multiple currencies:

```json
{
  "prices": [
    { "currency": "BRL", "price": 50.00, "isDefault": true },
    { "currency": "USD", "price": 10.00, "isDefault": false },
    { "currency": "EUR", "price": 9.00, "isDefault": false }
  ]
}
```

### Pricing Calculation

**Total Plan Price per Currency = Sum of all enabled feature prices**

Example:
- Feature 1 (BRL): R$ 50.00
- Feature 2 (BRL): R$ 30.00
- Feature 3 (BRL): R$ 20.00
- **Total Plan (BRL): R$ 100.00**

The same calculation applies for each currency:
- Feature 1 (USD): $10.00
- Feature 2 (USD): $6.00
- Feature 3 (USD): $4.00
- **Total Plan (USD): $20.00**

### Getting Plan Prices

When you fetch a plan, the API automatically includes calculated prices:

```json
{
  "id": 1,
  "name": "Pro Plan",
  "prices": [
    { "currency": "BRL", "price": 100.00, "isDefault": true },
    { "currency": "USD", "price": 20.00, "isDefault": false }
  ],
  "features": [...]
}
```

The `prices` array is calculated from all enabled features and shows the total plan price per currency.

## API Usage

### Get Plan with Calculated Prices

When you fetch a plan, the API automatically includes calculated prices:

```typescript
// GET /api/plans/:id
const plan = await plansService.findById(planId);

// Response includes calculated prices:
{
  "id": 1,
  "name": "Pro Plan",
  "billingPeriod": "MONTHLY",
  "prices": [
    { "currency": "BRL", "price": 100.00, "isDefault": true },
    { "currency": "USD", "price": 20.00, "isDefault": false },
    { "currency": "EUR", "price": 18.00, "isDefault": false }
  ],
  "features": [
    {
      "id": 1,
      "feature": { "name": "Loan Operations" },
      "prices": [
        { "currency": "BRL", "price": 50.00 },
        { "currency": "USD", "price": 10.00 }
      ]
    },
    {
      "id": 2,
      "feature": { "name": "Rental Operations" },
      "prices": [
        { "currency": "BRL", "price": 30.00 },
        { "currency": "USD", "price": 6.00 }
      ]
    }
  ]
}
```

The `prices` array at the plan level is calculated from all enabled features.

### Check Feature Limits

```typescript
// Get all feature limits for an account
const limits = await featureAuthService.getAccountFeatureLimits(accountId);

// Returns:
[
  {
    featureId: 1,
    featureKey: "loan_module",
    featureName: "Loan Operations",
    moduleKey: "loan",
    operationLimit: 10,
    resetPeriod: "MONTHLY",
    currentUsage: 7,
    remaining: 3
  },
  ...
]
```

### Check Before Operation Creation

```typescript
const check = await featureAuthService.checkFeatureOperationLimit(
  accountId,
  "LOAN",
  { moduleKey: "loan" } // optional meta
);

if (!check.allowed) {
  throw new Error(check.message);
  // "Operation limit reached for 'Loan Operations'. 
  //  Your plan allows 10 operations this month. Please upgrade your plan."
}
```

### Record Usage

```typescript
// Automatically called by OperationsService after operation creation
await featureAuthService.recordFeatureUsage(
  accountId,
  operationId,
  "LOAN",
  { moduleKey: "loan" }
);
```

## Middleware Protection

### Require Feature

Protect routes that require specific features:

```typescript
import { requireFeature } from '../middlewares/feature.middleware';

// Check if feature is enabled (no limit check)
router.post('/api/advanced-reports', 
  requireFeature('advanced_reports', false),
  reportsController.create
);

// Check feature and limits
router.post('/api/operations',
  requireFeature('loan_module', true),
  operationsController.create
);
```

### Middleware Behavior

- **Admin Bypass**: Admins can access all features
- **Feature Check**: Verifies feature is enabled in plan
- **Limit Check**: (optional) Validates usage vs. limit
- **Request Enhancement**: Adds `req.feature` with feature details

## Error Responses

### Feature Not Enabled

```json
{
  "success": false,
  "error": {
    "message": "Feature 'Loan Operations' is not enabled in your plan. Please upgrade your plan.",
    "code": "FEATURE_NOT_ENABLED"
  }
}
```

### Limit Reached

```json
{
  "success": false,
  "error": {
    "message": "Operation limit reached for 'Loan Operations'. Your plan allows 10 operations this month. Please upgrade your plan.",
    "code": "FEATURE_LIMIT_REACHED",
    "data": {
      "current": 10,
      "limit": 10,
      "feature": "Loan Operations"
    }
  }
}
```

## Best Practices

### 1. Plan Design

- **Free Plan**: Low limits, basic features
- **Pro Plan**: Higher limits, all features
- **Enterprise Plan**: Unlimited or very high limits

### 2. Feature Limits

- Set realistic limits based on user needs
- Use MONTHLY for regular operations
- Use LIFETIME for one-time features
- Use YEARLY for annual quotas

### 3. Pricing Strategy

- **No base plan price** - all pricing comes from features
- Plan price = sum of enabled feature prices per currency
- Set default currency based on target market (`isDefault: true`)
- Support multiple currencies for international users
- Disable features to create different plan tiers (Free, Pro, Enterprise)

### 4. Operation Types

- Map each operation type to a module
- Create features for each module
- Link features to plans with appropriate limits

## Example Scenarios

### Scenario 1: Free Plan User

- Plan: Free
- Feature: Loan Module
- Limit: 2 operations/month
- Current: 2/2 used
- Result: ❌ Blocked - "Limit reached, upgrade to Pro"

### Scenario 2: Pro Plan User

- Plan: Pro
- Feature: Loan Module
- Limit: 10 operations/month
- Current: 7/10 used
- Result: ✅ Allowed - "3 remaining this month"

### Scenario 3: Enterprise Plan User

- Plan: Enterprise
- Feature: Loan Module
- Limit: null (unlimited)
- Current: 150 operations
- Result: ✅ Allowed - "Unlimited"

### Scenario 4: Feature Not in Plan

- Plan: Basic
- Feature: Advanced Reports
- Result: ❌ Blocked - "Feature not enabled in your plan"

## Migration Guide

### From FeaturePrice to PlanFeaturePrice

If migrating existing data:

1. For each `FeaturePrice`:
   - Find all plans that include the feature
   - Create `PlanFeaturePrice` for each plan-feature combination
   - Copy currency and price
   - Set `isDefault` based on plan currency

2. Update existing plans:
   - Set `resetPeriod` to `LIFETIME` (default)
   - Configure `operationLimit` per feature
   - Add multi-currency prices

## Troubleshooting

### Issue: Operations not being blocked

**Check:**
1. Feature is enabled in plan (`isEnabled: true`)
2. Operation limit is set (not `null`)
3. Feature mapping is correct (operation type → module → feature)
4. Usage tracking is working (check `FeatureUsage` table)

### Issue: Usage not resetting

**Check:**
1. Reset period is correct (MONTHLY/YEARLY/LIFETIME)
2. Period calculation is correct (check `FeatureUsage.period`)
3. Cron job for resetting (if needed) is running

### Issue: Wrong feature being checked

**Check:**
1. Operation type mapping in `FeatureAuthorizationService`
2. Module key in operation `meta` field
3. Feature is linked to correct module

## Related Files

- **Schema**: `prisma/schema.prisma`
- **Service**: `src/services/featureAuthorizationService.ts`
- **Service**: `src/services/plansService.ts`
- **Service**: `src/services/operationsService.ts`
- **Middleware**: `src/middlewares/feature.middleware.ts`
- **DTOs**: `src/dtos/plans.dto.ts`, `src/dtos/features.dto.ts`

## Summary

This system provides:

✅ **Flexible Plans**: Multiple subscription tiers with customizable features  
✅ **Feature-Based Limits**: Per-feature operation limits with reset periods  
✅ **Multi-Currency Pricing**: Support for different currencies per feature  
✅ **Automatic Authorization**: Built-in checks before operation creation  
✅ **Usage Tracking**: Detailed tracking of feature usage per account  
✅ **Middleware Protection**: Easy route protection with feature checks  

The system automatically enforces limits, tracks usage, and provides clear error messages to guide users toward plan upgrades when needed.

