# New Excel Template Format for Question Import

## Overview

The Excel template for importing questions has been **significantly updated** to support both **Objective Questions** (traditional right/wrong) and **Personality Questions** (trait assessment). This new format allows you to create comprehensive tests that include both cognitive assessments and personality profiling.

## 🆕 What's New

### New Features

- **Dual Question Types**: Support for both `OBJECTIVE` and `PERSONALITY` questions
- **Personality Dimension Mapping**: Link personality questions to specific traits
- **Answer Weights**: Scoring system for personality assessments
- **Enhanced Validation**: Comprehensive error checking for both question types
- **Auto-Creation**: Personality dimensions are automatically created if they don't exist

### New Template Columns

| Column                     | Description                                    | Required                         | Example       |
| -------------------------- | ---------------------------------------------- | -------------------------------- | ------------- |
| `questionType`             | Type of question: `OBJECTIVE` or `PERSONALITY` | Optional (defaults to OBJECTIVE) | `PERSONALITY` |
| `answerWeights`            | JSON array of weights for personality scoring  | Required for PERSONALITY         | `[1,2,3,4,5]` |
| `personalityDimensionCode` | Code for personality trait being measured      | Required for PERSONALITY         | `EXT`         |

## 📋 Template Structure

### Complete Column List (15 columns)

1. **promptText** - Question text
2. **questionType** - OBJECTIVE or PERSONALITY
3. **category** - VERBAL, NUMERICAL, LOGICAL, ATTENTION_TO_DETAIL
4. **timerSeconds** - Time limit (5-300 seconds)
5. **correctAnswerIndex** - A, B, C, D, E, F (OBJECTIVE only)
6. **Answer A** - First answer option
7. **Answer B** - Second answer option
8. **Answer C** - Third answer option (optional)
9. **Answer D** - Fourth answer option (optional)
10. **Answer E** - Fifth answer option (optional)
11. **Answer F** - Sixth answer option (optional)
12. **answerWeights** - JSON scoring array (PERSONALITY only)
13. **personalityDimensionCode** - Trait code (PERSONALITY only)
14. **promptImageUrl** - Image URL (optional)
15. **sectionTag** - Grouping tag (optional)

## 🎯 Question Types

### OBJECTIVE Questions (Traditional)

These are standard right/wrong questions with a single correct answer.

**Required Fields:**

- `promptText`
- `questionType`: `OBJECTIVE` (or leave blank)
- `category`
- `timerSeconds`
- `correctAnswerIndex`: A, B, C, D, E, or F
- At least 2 answer options

**Leave Blank:**

- `answerWeights`
- `personalityDimensionCode`

**Example:**

```
promptText: "What is 2 + 2?"
questionType: OBJECTIVE
category: NUMERICAL
timerSeconds: 15
correctAnswerIndex: B
Answer A: 3
Answer B: 4
Answer C: 5
Answer D: 6
answerWeights: [blank]
personalityDimensionCode: [blank]
```

### PERSONALITY Questions (Trait Assessment)

These assess personality traits using Likert scales with no right/wrong answers.

**Required Fields:**

- `promptText`
- `questionType`: `PERSONALITY`
- `category` (usually VERBAL)
- `timerSeconds`
- `answerWeights`: JSON array matching answer count
- `personalityDimensionCode`: Trait code
- At least 2 answer options

**Leave Blank:**

- `correctAnswerIndex`

**Example:**

```
promptText: "I enjoy being the center of attention at social gatherings"
questionType: PERSONALITY
category: VERBAL
timerSeconds: 30
correctAnswerIndex: [blank]
Answer A: Strongly Disagree
Answer B: Disagree
Answer C: Neutral
Answer D: Agree
Answer E: Strongly Agree
answerWeights: [1,2,3,4,5]
personalityDimensionCode: EXT
```

## 🧠 Personality Dimensions

### Common Dimension Codes

The template includes dropdowns with these common personality dimensions:

**Big Five Model:**

- `EXT` - Extraversion (outgoing vs reserved)
- `AGR` - Agreeableness (cooperative vs competitive)
- `CON` - Conscientiousness (organized vs flexible)
- `NEU` - Neuroticism (emotional stability)
- `OPE` - Openness (creative vs practical)

**DISC Model:**

- `DOM` - Dominance (assertive vs accommodating)
- `INF` - Influence (persuasive vs reserved)
- `STE` - Steadiness (patient vs urgent)
- `COM` - Compliance (rule-following vs independent)

**Other Traits:**

- `EI` - Emotional Intelligence
- `STR` - Stress Tolerance
- `ADA` - Adaptability
- `LEA` - Leadership
- `TEA` - Teamwork

### Auto-Creation

If you use a dimension code that doesn't exist in the database, it will be automatically created with:

- **Code**: Your provided code (uppercase)
- **Name**: Same as code
- **Description**: Auto-generated description

## ⚖️ Answer Weights

Answer weights define how each response option contributes to the personality score.

### Standard Patterns

**5-Point Likert Scale (Normal):**

```json
[1, 2, 3, 4, 5]
```

- Strongly Disagree = 1 point
- Disagree = 2 points
- Neutral = 3 points
- Agree = 4 points
- Strongly Agree = 5 points

**5-Point Likert Scale (Reverse Scored):**

```json
[5, 4, 3, 2, 1]
```

Use for negative trait indicators where disagreement indicates higher trait levels.

**3-Point Scale:**

```json
[1, 3, 5]
```

Skip middle values for simpler assessments.

**Custom Weights:**

```json
[0, 1, 2, 4, 6]
```

Use any numeric values that fit your scoring model.

### Important Rules

- Array length must match number of answer options
- All values must be numbers
- Use valid JSON format (square brackets, comma-separated)

## 📊 Template Features

### Excel Features

- **Dropdowns**: Question Type, Category, Answer Index, Personality Dimension, Section Tag
- **Data Validation**: Prevents invalid entries
- **Multiple Sheets**: Template, Instructions, Examples
- **Styling**: Color-coded headers and sections

### CSV Support

- Same column structure as Excel
- Manual entry (no dropdowns)
- Proper CSV escaping for commas and quotes

## 🔄 Import Process

### Validation

The import process validates:

1. **Question Type**: Must be OBJECTIVE or PERSONALITY
2. **Required Fields**: Based on question type
3. **Answer Weights**: Valid JSON for personality questions
4. **Dimension Codes**: Auto-creates if missing
5. **Answer Count**: Matches weights array length
6. **Cross-Validation**: Ensures type-specific fields are correct

### Error Handling

- **Detailed Errors**: Row-by-row validation with specific messages
- **Partial Success**: Valid questions imported even if some fail
- **Transaction Safety**: All-or-nothing database operations
- **Empty Row Skipping**: Automatically ignores blank rows

## 📁 File Access

### Download Templates

- **Excel**: `/api/questions/template` (default)
- **CSV**: `/api/questions/template?format=csv`

### Import Endpoint

- **URL**: `/api/questions/import`
- **Method**: POST
- **Content**: multipart/form-data
- **Fields**: `file` (Excel/CSV), `testId`

## 🎨 Best Practices

### Question Design

1. **Clear Language**: Use simple, unambiguous wording
2. **Balanced Scales**: Include both positive and negative trait indicators
3. **Consistent Timing**: Use appropriate time limits for question complexity
4. **Logical Grouping**: Use section tags to organize related questions

### File Organization

1. **Mixed Types**: Combine objective and personality questions in one file
2. **Logical Order**: Group similar questions together
3. **Clear Naming**: Use descriptive section tags
4. **Validation**: Always download and test with sample data first

### Personality Assessment

1. **Multiple Questions**: Use several questions per dimension for reliability
2. **Reverse Scoring**: Include both positive and negative indicators
3. **Balanced Options**: Provide clear, evenly spaced response options
4. **Appropriate Weights**: Use consistent scoring scales

## 🚀 Getting Started

1. **Download Template**: Get the latest Excel template from the admin panel
2. **Review Examples**: Check the Examples sheet for sample questions
3. **Plan Your Test**: Decide on objective vs personality question mix
4. **Fill Template**: Use dropdowns and follow validation rules
5. **Test Import**: Start with a small sample to verify format
6. **Full Import**: Upload your complete question set

## 🔧 Technical Notes

### Database Schema

- Questions support both `questionType` and `personalityDimensionId`
- Answer weights stored as JSON in `answerWeights` field
- Personality dimensions auto-created with unique codes
- Backward compatibility maintained for existing objective questions

### API Changes

- Template API updated with new columns and validation
- Import API enhanced with personality question support
- Comprehensive error reporting for both question types
- Transaction-based imports for data integrity

This new format provides a powerful foundation for creating comprehensive assessments that evaluate both cognitive abilities and personality traits in a single, streamlined workflow.
