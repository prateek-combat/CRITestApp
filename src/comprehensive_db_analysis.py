#!/usr/bin/env python3
import subprocess
import re
from collections import defaultdict

print("=== COMPREHENSIVE DATABASE USAGE ANALYSIS ===\n")

# Schema definition - tables and their columns
schema = {
    "user": ["id", "email", "passwordHash", "firstName", "lastName", "role", "createdAt", "updatedAt"],
    "position": ["id", "name", "code", "description", "department", "level", "isActive", "createdAt", "updatedAt", "createdById"],
    "jobProfile": ["id", "name", "description", "isActive", "createdAt", "updatedAt", "createdById"],
    "testWeight": ["id", "jobProfileId", "testId", "weight", "createdAt", "updatedAt"],
    "jobProfileInvitation": ["id", "jobProfileId", "candidateEmail", "candidateName", "status", "expiresAt", "createdAt", "updatedAt", "createdById"],
    "test": ["id", "title", "description", "lockOrder", "createdAt", "updatedAt", "createdById", "positionId", "allowReview", "isArchived", "archivedAt", "archivedById", "emailNotificationsEnabled", "notificationEmails", "includeAnalytics"],
    "personalityDimension": ["id", "name", "description", "code", "createdAt", "updatedAt"],
    "question": ["id", "promptText", "promptImageUrl", "timerSeconds", "answerOptions", "correctAnswerIndex", "sectionTag", "category", "createdAt", "updatedAt", "testId", "answerWeights", "personalityDimensionId", "questionType"],
    "invitation": ["id", "candidateEmail", "candidateName", "expiresAt", "status", "createdAt", "updatedAt", "testId", "createdById"],
    "testAttempt": ["id", "candidateName", "candidateEmail", "ipAddress", "startedAt", "completedAt", "status", "rawScore", "percentile", "categorySubScores", "tabSwitches", "proctoringEnabled", "videoRecordingUrl", "audioRecordingUrl", "proctoringEvents", "faceCapturesUrls", "screenRecordingUrl", "proctoringStartedAt", "proctoringEndedAt", "permissionsGranted", "riskScore", "currentQuestionIndex", "createdAt", "updatedAt", "invitationId", "testId", "jobProfileInvitationId", "personalityProfile", "personalityScores", "riskScoreBreakdown"],
    "submittedAnswer": ["id", "selectedAnswerIndex", "isCorrect", "timeTakenSeconds", "submittedAt", "testAttemptId", "questionId"],
    "proctorEvent": ["id", "attemptId", "type", "ts", "extra"],
    "proctorAsset": ["id", "attemptId", "kind", "fileName", "mimeType", "fileSize", "data", "ts"],
    "publicTestLink": ["id", "testId", "linkToken", "title", "description", "isActive", "expiresAt", "maxUses", "usedCount", "createdAt", "updatedAt", "createdById"],
    "publicTestAttempt": ["id", "publicLinkId", "candidateName", "candidateEmail", "ipAddress", "startedAt", "completedAt", "status", "rawScore", "percentile", "categorySubScores", "tabSwitches", "proctoringEnabled", "videoRecordingUrl", "audioRecordingUrl", "proctoringEvents", "faceCapturesUrls", "screenRecordingUrl", "proctoringStartedAt", "proctoringEndedAt", "permissionsGranted", "riskScore", "currentQuestionIndex", "createdAt", "updatedAt", "personalityProfile", "personalityScores", "riskScoreBreakdown"],
    "publicSubmittedAnswer": ["id", "selectedAnswerIndex", "isCorrect", "timeTakenSeconds", "submittedAt", "attemptId", "questionId"],
    "publicProctorEvent": ["id", "attemptId", "type", "ts", "extra"],
    "publicProctorAsset": ["id", "attemptId", "kind", "fileName", "mimeType", "fileSize", "data", "ts"],
    "uploadedFile": ["id", "fileName", "mimeType", "fileSize", "data", "fileType", "uploadedAt", "uploadedBy"],
    "categoryWeightProfile": ["id", "name", "description", "weights", "isDefault", "isSystem", "createdAt", "updatedAt", "createdById"]
}

# Tables that appear to be used based on grep results
used_tables = [
    "user", "testAttempt", "publicTestAttempt", "test", "invitation",
    "position", "question", "publicTestLink", "categoryWeightProfile",
    "personalityDimension", "proctorAsset", "publicProctorAsset",
    "publicProctorEvent", "proctorEvent", "jobProfile", "uploadedFile",
    "publicSubmittedAnswer", "submittedAnswer", "jobProfileInvitation"
]

# Find usage count for each table
table_operations = {}
for table in schema.keys():
    cmd = f'grep -r "prisma\.{table}\." --include="*.ts" --include="*.tsx" . 2>/dev/null | wc -l'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    count = int(result.stdout.strip())
    table_operations[table] = count

# Sort tables by usage
sorted_tables = sorted(table_operations.items(), key=lambda x: x[1], reverse=True)

print("=== TABLE USAGE STATISTICS ===\n")
for table, count in sorted_tables:
    if count > 0:
        print(f"✅ {table}: {count} references")
    else:
        print(f"❌ {table}: NO USAGE FOUND")

# Tables not found in schema
potentially_unused_tables = []
for table in schema.keys():
    if table_operations[table] == 0:
        potentially_unused_tables.append(table)

# Now analyze column usage for used tables
print("\n\n=== COLUMN USAGE ANALYSIS ===\n")

for table, count in sorted_tables:
    if count > 0:
        print(f"\n### Table: {table} ({count} references)")
        
        # Get sample files that use this table
        cmd = f'grep -l "prisma\.{table}\." --include="*.ts" --include="*.tsx" . 2>/dev/null | head -5'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        files = result.stdout.strip().split('\n') if result.stdout else []
        
        column_usage = defaultdict(int)
        
        # Analyze column usage in these files
        for file in files[:3]:  # Check first 3 files
            if file:
                cmd = f'cat "{file}"'
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                content = result.stdout
                
                # Look for column references in select, where, create, update contexts
                for column in schema.get(table, []):
                    # Check various patterns where columns might be referenced
                    patterns = [
                        f'{column}:',  # in select/where/data objects
                        f'\\.{column}',  # property access
                        f'"{column}"',  # string references
                        f"'{column}'",  # string references
                        f'`{column}`',  # template string references
                    ]
                    
                    for pattern in patterns:
                        if pattern in content:
                            column_usage[column] += content.count(pattern)
        
        # Print column usage
        used_columns = []
        unused_columns = []
        
        for column in schema.get(table, []):
            if column_usage[column] > 0:
                used_columns.append(column)
            else:
                unused_columns.append(column)
        
        print(f"  Used columns ({len(used_columns)}):", ", ".join(used_columns))
        if unused_columns:
            print(f"  Potentially unused columns ({len(unused_columns)}):", ", ".join(unused_columns))

# Summary
print("\n\n=== SUMMARY ===\n")
print(f"Total tables in schema: {len(schema)}")
print(f"Used tables: {len([t for t, c in table_operations.items() if c > 0])}")
print(f"Unused tables: {len(potentially_unused_tables)}")

if potentially_unused_tables:
    print("\nCompletely unused tables:")
    for table in potentially_unused_tables:
        print(f"  - {table}")

# Check for testWeight usage specifically
print("\n\n=== SPECIAL CASES ===\n")
print("Checking testWeight table (might be used in relations):")
cmd = 'grep -r "testWeight" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v "schema.prisma" | wc -l'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(f"  References to 'testWeight': {result.stdout.strip()}")