# Configurable Category Weights Feature

## Overview

The Configurable Category Weights feature allows administrators to create custom weighting schemes for test categories, enabling different ranking systems based on specific job requirements or organizational priorities.

## 🎯 Problem Solved

**Before**: All categories had equal weight (20% each)
- LOGICAL: 20%
- VERBAL: 20% 
- NUMERICAL: 20%
- ATTENTION_TO_DETAIL: 20%
- OTHER: 20%

**Now**: Administrators can configure custom weights:
- **Verbal Focused**: VERBAL: 50%, LOGICAL: 15%, NUMERICAL: 15%, ATTENTION_TO_DETAIL: 15%, OTHER: 5%
- **Technical Roles**: LOGICAL: 45%, VERBAL: 20%, NUMERICAL: 20%, ATTENTION_TO_DETAIL: 10%, OTHER: 5%
- **Quality Roles**: ATTENTION_TO_DETAIL: 40%, LOGICAL: 20%, VERBAL: 20%, NUMERICAL: 15%, OTHER: 5%

## 🏗️ Implementation Summary

### Database Changes
- **New Table**: `CategoryWeightProfile`
  - Stores weight configurations as named profiles
  - System profiles cannot be deleted
  - One profile can be set as default

### API Endpoints
- `GET /api/admin/category-weights` - List all profiles
- `POST /api/admin/category-weights` - Create new profile
- `GET /api/admin/category-weights/[id]` - Get specific profile
- `PUT /api/admin/category-weights/[id]` - Update profile
- `DELETE /api/admin/category-weights/[id]` - Delete profile
- `POST /api/admin/category-weights/[id]/set-default` - Set as default

### UI Components
- **Admin Panel**: `/admin/weight-profiles`
  - Visual weight management interface
  - Real-time validation (weights must sum to 100%)
  - Default profile management

### Updated Leaderboard
- `GET /api/admin/leaderboard?weightProfile=<id>` - Apply specific weight profile
- Backward compatible (uses default profile if none specified)
- Returns both weighted and unweighted scores for comparison

## 📋 Setup Instructions

### 1. Database Migration

**⚠️ IMPORTANT: This only ADDS a new table, no existing data is affected**

```bash
# Generate and apply the migration
npx prisma migrate dev --name add_category_weight_profiles

# Initialize default weight profiles
node scripts/initialize-weight-profiles.js
```

### 2. Verify Installation

1. **Check Admin Panel**: Navigate to `/admin/weight-profiles`
2. **Verify Default Profiles**: Should see 5 predefined profiles
3. **Test Leaderboard**: Try different weight profiles in leaderboard view

## 🎨 Usage Examples

### Creating a Custom Profile

```typescript
// Via API
const response = await fetch('/api/admin/category-weights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sales Focused',
    description: 'Optimized for sales positions',
    weights: {
      LOGICAL: 10,
      VERBAL: 60,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 5,
      OTHER: 5,
    },
  }),
});
```

### Using Weight Profiles in Leaderboard

```typescript
// Get leaderboard with specific weight profile
const leaderboard = await fetch('/api/admin/leaderboard?testId=123&weightProfile=profile-id');

// Response includes both weighted and unweighted scores
const data = await leaderboard.json();
console.log(data.weightProfile); // Active weight profile info
console.log(data.rows[0].composite); // Weighted score
console.log(data.rows[0].compositeUnweighted); // Original score
```

## 🔧 Technical Details

### Weight Calculation Algorithm

```typescript
function calculateWeightedComposite(
  categoryScores: Record<string, { correct: number; total: number }>,
  weights: CategoryWeights
): number {
  let weightedSum = 0;
  let totalValidWeight = 0;

  Object.entries(weights).forEach(([category, weight]) => {
    const categoryData = categoryScores[category];
    if (categoryData && categoryData.total > 0) {
      const categoryPercentage = (categoryData.correct / categoryData.total) * 100;
      weightedSum += categoryPercentage * (weight / 100);
      totalValidWeight += weight;
    }
  });

  // Normalize by actual valid weights (handles missing categories)
  return totalValidWeight > 0 ? (weightedSum * 100) / totalValidWeight : 0;
}
```

### Validation Rules

1. **Weights must sum to 100%** (±0.01% tolerance for floating point errors)
2. **No negative weights** allowed
3. **Unique profile names** required
4. **System profiles** cannot be modified/deleted
5. **Default profile** cannot be deleted

## 📊 Predefined Weight Profiles

### 1. Equal Weights (Default)
- **Use Case**: Balanced assessment for general roles
- **Weights**: All categories 20% each

### 2. Verbal Focused  
- **Use Case**: Communication, sales, customer service roles
- **Weights**: VERBAL 50%, others 15%, OTHER 5%

### 3. Logical Reasoning Priority
- **Use Case**: Technical, engineering, development roles  
- **Weights**: LOGICAL 45%, VERBAL/NUMERICAL 20%, ATTENTION 10%, OTHER 5%

### 4. Analytical Balance
- **Use Case**: Data analysis, research, quantitative roles
- **Weights**: NUMERICAL 35%, LOGICAL 30%, VERBAL/ATTENTION 15%, OTHER 5%

### 5. Detail-Oriented
- **Use Case**: Quality assurance, auditing, precision roles
- **Weights**: ATTENTION 40%, LOGICAL/VERBAL 20%, NUMERICAL 15%, OTHER 5%

## 🔍 Monitoring & Analytics

### Useful Queries

```sql
-- Most used weight profiles
SELECT name, COUNT(*) as usage_count 
FROM leaderboard_requests lr
JOIN CategoryWeightProfile cwp ON lr.weight_profile_id = cwp.id
GROUP BY name ORDER BY usage_count DESC;

-- Score comparison: weighted vs unweighted
SELECT 
  candidate_name,
  composite_weighted,
  composite_unweighted,
  (composite_weighted - composite_unweighted) as score_difference
FROM test_results 
WHERE test_id = 'specific-test-id'
ORDER BY composite_weighted DESC;
```

### Impact Analysis

Monitor how different weight profiles affect:
- **Ranking Changes**: Candidates moving up/down in leaderboard
- **Score Distribution**: How weights impact overall score spread
- **Category Emphasis**: Which profiles are most/least used

## 🚀 Future Enhancements

### Potential Features
1. **Test-Specific Weights**: Different weights per test
2. **Dynamic Weights**: AI-suggested weights based on job descriptions
3. **A/B Testing**: Compare hiring outcomes with different weight schemes
4. **Export Capabilities**: Download ranking comparisons
5. **Candidate Insights**: Show candidates how they perform under different schemes

## 🛡️ Data Safety

### What's Protected
- ✅ **All existing test data** remains unchanged
- ✅ **Existing leaderboards** continue working with default weights
- ✅ **Backward compatibility** maintained for all APIs
- ✅ **No data loss** - only additive changes

### Migration Safety
```sql
-- The migration only adds a new table:
CREATE TABLE "CategoryWeightProfile" (
  id String PRIMARY KEY DEFAULT uuid(),
  name String UNIQUE,
  description String,
  weights Json,
  isDefault Boolean DEFAULT false,
  isSystem Boolean DEFAULT false,
  createdAt DateTime DEFAULT now(),
  updatedAt DateTime DEFAULT updatedAt(),
  createdById String REFERENCES "User"(id)
);
```

## 🤝 Support

For questions or issues:
1. Check the admin panel at `/admin/weight-profiles`
2. Review the initialization script: `scripts/initialize-weight-profiles.js`
3. Verify API endpoints are working via browser dev tools
4. Check Prisma schema for model definitions

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Breaking Changes**: None - Fully backward compatible 