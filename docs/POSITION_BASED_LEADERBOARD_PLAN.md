# 📋 **POSITION-BASED TEST SEGREGATION & ENHANCED LEADERBOARD PLAN**

## **Overview**

This document outlines the comprehensive plan to implement position-based test segregation and enhanced leaderboard visualization. The system will allow better organization of tests by job positions/roles and provide enhanced analytics and comparison capabilities.

## **Current State Analysis**

### **Current System:**
- Tests are created with only `title` and `description` fields
- Leaderboards filter by individual `testId` 
- Analytics are organized by test name only
- No position/role categorization exists
- Each test has separate leaderboards and analytics

### **Limitations:**
- No way to group tests by position/role
- Can't compare candidates across similar positions
- Difficult to analyze hiring trends by role
- No position-specific analytics dashboard

---

## **🎯 IMPLEMENTATION PLAN**

### **Phase 1: Database Schema Enhancement**

#### **1.1 Create Position/Role Management System**
```sql
-- New table for managing positions
model Position {
  id          String   @id @default(uuid())
  name        String   @unique  // e.g., "Software Engineer", "Mechanical Engineer"
  code        String   @unique  // e.g., "SWE", "MECH"
  description String?
  department  String?  // e.g., "Engineering", "Operations"
  level       String?  // e.g., "Junior", "Senior", "Lead"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  
  // Relations
  tests       Test[]
  createdBy   User     @relation(fields: [createdById], references: [id])
  
  @@index([isActive, department])
  @@index([code])
}
```

#### **1.2 Update Test Model**
```sql
model Test {
  // ... existing fields ...
  positionId  String?  // Link to position (NULLABLE for backward compatibility)
  position    Position? @relation(fields: [positionId], references: [id])
  
  @@index([positionId, isArchived])
}
```

**⚠️ CRITICAL DATA MIGRATION REQUIREMENTS:**
- **NEVER DELETE** existing test data
- **NEVER DELETE** existing test attempts or results
- **NEVER DELETE** existing invitations or candidate data
- All existing tests will remain fully functional during and after migration
- Position field is NULLABLE to maintain backward compatibility
- Existing URLs and functionality must continue to work

### **Phase 2: Position Management Interface**

#### **2.1 Admin Position Management**
- Create `/admin/positions` page
- CRUD operations for positions
- Position hierarchy management
- Bulk position operations

#### **2.2 Enhanced Test Creation**
- Add position selector to test creation form
- Position-based test templates
- Bulk test creation for multiple positions

### **Phase 3: Enhanced Leaderboard System**

#### **3.1 Position-Based Leaderboard Navigation**
```typescript
// New sidebar structure
interface PositionGroup {
  position: Position;
  tests: Test[];
  totalCandidates: number;
  avgScore: number;
  recentActivity: Date;
}
```

#### **3.2 Multi-Level Leaderboard Views**
- **Department Level**: All positions in department
- **Position Level**: All tests for specific position
- **Test Level**: Individual test results (current system)
- **Cross-Position Comparison**: Compare similar roles

#### **3.3 Enhanced Filtering & Sorting**
- Filter by department, position level, date range
- Sort by performance, activity, position hierarchy
- Search across positions and tests

### **Phase 4: Advanced Analytics Dashboard**

#### **4.1 Position Analytics Overview**
```typescript
interface PositionAnalytics {
  positionId: string;
  positionName: string;
  totalTests: number;
  totalCandidates: number;
  avgScore: number;
  hirePipeline: {
    applied: number;
    tested: number;
    passed: number;
    hired: number;
  };
  performanceTrends: TimeSeriesData[];
  topPerformers: CandidateScore[];
}
```

#### **4.2 Department-Level Analytics**
- Cross-position performance comparison
- Hiring funnel analysis
- Skill gap identification
- Recruitment ROI metrics

#### **4.3 Enhanced Reporting**
- Position-specific performance reports
- Comparative analysis across positions
- Hiring trend reports
- Skill assessment reports

### **Phase 5: UI/UX Enhancements**

#### **5.1 New Leaderboard Layout**
```
┌─────────────────────────────────────────────────────────────────┐
│ POSITIONS SIDEBAR    │    LEADERBOARD CONTENT                   │
│                      │                                          │
│ 🏢 Engineering       │  📊 Software Engineer - React Developer │
│   └ Software Eng.    │  ┌─────────────────────────────────────┐ │
│     ├ React Dev      │  │ Test: React Skills Assessment      │ │
│     ├ Node.js Dev    │  │ Position: Software Engineer        │ │
│     └ Full Stack     │  │ Level: Mid-Level                   │ │
│   └ Mechanical Eng.  │  │ Candidates: 45 | Avg: 78.5%       │ │
│     ├ Design Eng.    │  └─────────────────────────────────────┘ │
│     └ Systems Eng.   │                                          │
│                      │  [Leaderboard Table]                    │
│ 🏭 Operations        │                                          │
│   └ Process Eng.     │                                          │
│                      │                                          │
└─────────────────────────────────────────────────────────────────┘
```

#### **5.2 Enhanced Filtering Interface**
- Multi-select position filtering
- Date range with presets
- Performance threshold filtering
- Export options for each view

#### **5.3 Comparison Tools**
- Side-by-side position comparison
- Candidate comparison across positions
- Performance benchmarking

### **Phase 6: Data Migration & Preservation Strategy**

#### **6.1 Zero-Downtime Migration Strategy**
```sql
-- Step 1: Add new columns (non-breaking)
ALTER TABLE "Test" ADD COLUMN "positionId" TEXT;
ALTER TABLE "Test" ADD CONSTRAINT "Test_positionId_fkey" 
  FOREIGN KEY ("positionId") REFERENCES "Position"("id");

-- Step 2: Create default positions for existing tests
INSERT INTO "Position" (id, name, code, description, "createdById", "isActive")
VALUES 
  (gen_random_uuid(), 'Unassigned', 'UNASSIGNED', 'Legacy tests without position assignment', 
   (SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1), true);

-- Step 3: Optionally assign positions to existing tests
-- (This step is manual and preserves all existing data)
```

#### **6.2 Data Preservation Guarantees**
- ✅ **All existing tests remain accessible**
- ✅ **All test attempts and scores preserved**
- ✅ **All invitations and candidate data intact**
- ✅ **All existing URLs continue to work**
- ✅ **All analytics data preserved**
- ✅ **Backward compatibility maintained**

#### **6.3 Migration Verification**
- Pre-migration data count verification
- Post-migration data integrity checks
- Automated tests for data preservation
- Rollback plan if needed

---

## **🔧 TECHNICAL IMPLEMENTATION DETAILS**

### **API Endpoints**
```typescript
// Position Management
GET    /api/admin/positions
POST   /api/admin/positions
PUT    /api/admin/positions/[id]
DELETE /api/admin/positions/[id]

// Enhanced Leaderboards
GET    /api/admin/leaderboard/positions
GET    /api/admin/leaderboard/positions/[positionId]
GET    /api/admin/leaderboard/departments/[department]

// Analytics
GET    /api/admin/analytics/positions
GET    /api/admin/analytics/positions/[positionId]
GET    /api/admin/analytics/departments/[department]
```

### **Database Queries Optimization**
```sql
-- Position-based leaderboard query
SELECT 
  p.name as position_name,
  t.title as test_title,
  COUNT(ta.id) as total_attempts,
  AVG(ta.rawScore) as avg_score,
  MAX(ta.completedAt) as last_activity
FROM Position p
JOIN Test t ON t.positionId = p.id
JOIN TestAttempt ta ON ta.testId = t.id
WHERE p.isActive = true
GROUP BY p.id, t.id
ORDER BY p.name, t.createdAt DESC;
```

### **Component Architecture**
```typescript
// New component structure
/admin/leaderboard/
├── positions/
│   ├── page.tsx                    // Position overview
│   ├── [positionId]/
│   │   ├── page.tsx               // Position-specific leaderboard
│   │   └── compare/page.tsx       // Position comparison
│   └── _components/
│       ├── PositionSidebar.tsx
│       ├── PositionLeaderboard.tsx
│       └── PositionAnalytics.tsx
```

---

## **📊 BENEFITS OF THIS APPROACH**

1. **Better Organization**: Clear hierarchy of Department → Position → Test
2. **Enhanced Analytics**: Position-specific insights and trends
3. **Improved Hiring Process**: Better candidate comparison and evaluation
4. **Scalable Structure**: Easy to add new positions and departments
5. **Flexible Filtering**: Multiple ways to view and analyze data
6. **Backward Compatible**: Existing functionality remains intact
7. **Data Integrity**: Zero data loss during migration

---

## **🚀 IMPLEMENTATION PRIORITY**

### **High Priority (MVP):**
1. Database schema updates with data preservation
2. Position management interface
3. Basic position-based leaderboard
4. Test-position association

### **Medium Priority:**
1. Enhanced analytics dashboard
2. Advanced filtering and comparison
3. Reporting system

### **Low Priority (Future):**
1. Advanced AI-powered insights
2. Automated position recommendations
3. Integration with HR systems

---

## **🔒 DATA SAFETY PROTOCOLS**

### **Before Starting Migration:**
1. **Full database backup**
2. **Test migration on staging environment**
3. **Verify all existing functionality works**
4. **Document rollback procedures**

### **During Migration:**
1. **Monitor database performance**
2. **Verify data integrity at each step**
3. **Test existing functionality continuously**
4. **Keep detailed migration logs**

### **After Migration:**
1. **Comprehensive data verification**
2. **Performance testing**
3. **User acceptance testing**
4. **Monitor for any issues**

---

## **📝 IMPLEMENTATION NOTES**

- All changes will be made on a feature branch: `feature/position-based-leaderboard`
- Each phase will be implemented incrementally with thorough testing
- Existing APIs will remain functional during transition
- New features will be additive, not replacing existing functionality
- Migration scripts will include verification and rollback capabilities

---

## **🎯 SUCCESS CRITERIA**

1. ✅ Zero data loss during migration
2. ✅ All existing functionality preserved
3. ✅ Position-based organization implemented
4. ✅ Enhanced leaderboard and analytics working
5. ✅ Improved user experience for hiring teams
6. ✅ Better candidate evaluation and comparison tools
7. ✅ Scalable system for future growth

---

**Last Updated**: January 2025  
**Status**: Planning Phase  
**Branch**: `feature/position-based-leaderboard` 