# Personality Dimensions API

This API provides endpoints for managing personality dimensions in the testing platform.

## Base URL

```
/api/personality-dimensions
```

## Authentication

All endpoints require admin authentication (ADMIN or SUPER_ADMIN role).

## Endpoints

### 1. List All Personality Dimensions

```http
GET /api/personality-dimensions
```

**Response Example:**

```json
[
  {
    "id": "dimension-uuid",
    "name": "Safety-First Risk Management",
    "description": "Measures approach to safety and risk assessment",
    "code": "SAFETY_RISK_MGMT",
    "questionsCount": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2. Create New Personality Dimension

```http
POST /api/personality-dimensions
Content-Type: application/json

{
  "name": "Leadership Potential",
  "description": "Evaluates leadership qualities and decision-making",
  "code": "LEADERSHIP"
}
```

**Validation Rules:**

- `name`: Required, 1-200 characters
- `description`: Optional string
- `code`: Required, 1-50 characters, uppercase letters and underscores only

**Response (201):**

```json
{
  "id": "new-dimension-uuid",
  "name": "Leadership Potential",
  "description": "Evaluates leadership qualities and decision-making",
  "code": "LEADERSHIP",
  "questionsCount": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3. Get Specific Personality Dimension

```http
GET /api/personality-dimensions/{id}
```

**Response Example:**

```json
{
  "id": "dimension-uuid",
  "name": "Safety-First Risk Management",
  "description": "Measures approach to safety and risk assessment",
  "code": "SAFETY_RISK_MGMT",
  "questionsCount": 5,
  "questions": [
    {
      "id": "question-uuid",
      "promptText": "How do you approach workplace safety?",
      "testId": "test-uuid",
      "test": {
        "id": "test-uuid",
        "title": "Safety Assessment"
      }
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. Update Personality Dimension

```http
PUT /api/personality-dimensions/{id}
Content-Type: application/json

{
  "name": "Updated Safety Management",
  "description": "Updated description of safety approach",
  "code": "UPDATED_SAFETY_MGMT"
}
```

**Response (200):**

```json
{
  "id": "dimension-uuid",
  "name": "Updated Safety Management",
  "description": "Updated description of safety approach",
  "code": "UPDATED_SAFETY_MGMT",
  "questionsCount": 5,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### 5. Delete Personality Dimension

```http
DELETE /api/personality-dimensions/{id}
```

**Response (200):**

```json
{
  "message": "Personality dimension deleted successfully",
  "deletedDimension": {
    "id": "dimension-uuid",
    "name": "Safety-First Risk Management",
    "code": "SAFETY_RISK_MGMT"
  }
}
```

## Error Responses

### 400 - Validation Error

```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "code",
      "message": "Code must contain only uppercase letters and underscores"
    }
  ]
}
```

### 401 - Unauthorized

```json
{
  "message": "Unauthorized"
}
```

### 404 - Not Found

```json
{
  "message": "Personality dimension not found"
}
```

### 409 - Conflict

```json
{
  "message": "Personality dimension with this name already exists",
  "field": "name"
}
```

```json
{
  "message": "Cannot delete personality dimension with associated questions",
  "questionsCount": 5
}
```

### 500 - Internal Server Error

```json
{
  "message": "Internal server error"
}
```

## Test Personality Analysis

### Get Test Personality Analysis

```http
GET /api/tests/{testId}/personality-analysis
```

**Response Example:**

```json
{
  "testInfo": {
    "id": "test-uuid",
    "title": "Comprehensive Assessment",
    "description": "Mixed objective and personality test",
    "totalQuestions": 20,
    "personalityQuestions": 12,
    "objectiveQuestions": 8,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "dimensionCoverage": [
    {
      "dimensionId": "safety-uuid",
      "dimensionName": "Safety-First Risk Management",
      "dimensionCode": "SAFETY_RISK_MGMT",
      "dimensionDescription": "Measures approach to safety and risk assessment",
      "questionCount": 4,
      "questions": [
        {
          "id": "question-uuid",
          "promptText": "How do you approach workplace safety?",
          "answerOptions": [
            "Very carefully",
            "Carefully",
            "Normally",
            "Quickly",
            "Very quickly"
          ],
          "answerWeights": { "A": 5, "B": 4, "C": 3, "D": 2, "E": 1 },
          "category": "LOGICAL",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "dimensionComparison": [
    {
      "id": "safety-uuid",
      "name": "Safety-First Risk Management",
      "code": "SAFETY_RISK_MGMT",
      "description": "Measures approach to safety and risk assessment",
      "isUsedInTest": true,
      "questionCount": 4
    },
    {
      "id": "leadership-uuid",
      "name": "Leadership Potential",
      "code": "LEADERSHIP",
      "description": "Evaluates leadership qualities",
      "isUsedInTest": false,
      "questionCount": 0
    }
  ],
  "statistics": {
    "personalityQuestionPercentage": 60.0,
    "dimensionsUsed": 2,
    "totalAvailableDimensions": 5,
    "averageQuestionsPerDimension": 6.0,
    "testType": "MIXED"
  },
  "recommendations": [
    {
      "type": "suggestion",
      "category": "dimension_coverage",
      "message": "Only 2 out of 5 available personality dimensions are used. Consider expanding dimension coverage for a more comprehensive personality profile."
    }
  ]
}
```

## Usage Examples

### JavaScript/TypeScript Client

```typescript
// Create a new personality dimension
const response = await fetch('/api/personality-dimensions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Problem Solving',
    description: 'Evaluates analytical and creative problem-solving abilities',
    code: 'PROBLEM_SOLVING',
  }),
});

const newDimension = await response.json();

// Get test personality analysis
const analysisResponse = await fetch(
  `/api/tests/${testId}/personality-analysis`
);
const analysis = await analysisResponse.json();

// Update dimension
const updateResponse = await fetch(
  `/api/personality-dimensions/${dimensionId}`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Updated description for problem solving assessment',
    }),
  }
);
```

### cURL Examples

```bash
# Create personality dimension
curl -X POST /api/personality-dimensions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Communication Skills",
    "description": "Measures verbal and written communication effectiveness",
    "code": "COMMUNICATION"
  }'

# Get all dimensions
curl -X GET /api/personality-dimensions

# Get specific dimension
curl -X GET /api/personality-dimensions/dimension-uuid

# Update dimension
curl -X PUT /api/personality-dimensions/dimension-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated communication skills assessment"
  }'

# Delete dimension
curl -X DELETE /api/personality-dimensions/dimension-uuid

# Get test analysis
curl -X GET /api/tests/test-uuid/personality-analysis
```
