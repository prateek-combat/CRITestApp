#!/bin/bash

# Job Profiles UI Migration Script
# This script helps migrate to the improved Job Profiles UI

echo "Job Profiles UI Migration Script"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Create backup
echo "1. Creating backup of current page..."
if [ -f "src/app/admin/job-profiles/page.tsx" ]; then
    cp src/app/admin/job-profiles/page.tsx src/app/admin/job-profiles/page-backup-$(date +%Y%m%d-%H%M%S).tsx
    echo "   ✓ Backup created"
else
    echo "   ⚠ Current page not found"
fi

# Check if improved version exists
echo ""
echo "2. Checking for improved version..."
if [ -f "src/app/admin/job-profiles/page-improved.tsx" ]; then
    echo "   ✓ Improved version found"
else
    echo "   ✗ Improved version not found"
    exit 1
fi

# Check if new components exist
echo ""
echo "3. Checking for new components..."
components=(
    "src/components/admin/job-profiles/JobProfileCard.tsx"
    "src/components/admin/job-profiles/LinkManagementSection.tsx"
    "src/components/admin/job-profiles/LinkBuilder.tsx"
    "src/components/admin/job-profiles/TimeSlotCalendar.tsx"
    "src/components/admin/job-profiles/JobProfileDetailsModal.tsx"
)

all_components_exist=true
for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo "   ✓ $(basename $component)"
    else
        echo "   ✗ $(basename $component) not found"
        all_components_exist=false
    fi
done

if [ "$all_components_exist" = false ]; then
    echo ""
    echo "Error: Some components are missing. Please ensure all components are created."
    exit 1
fi

# Ask for confirmation
echo ""
echo "4. Ready to migrate to the improved UI?"
echo "   This will replace the current Job Profiles page with the improved version."
echo ""
read -p "   Continue? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Perform migration
    echo ""
    echo "5. Migrating to improved UI..."
    cp src/app/admin/job-profiles/page-improved.tsx src/app/admin/job-profiles/page.tsx
    echo "   ✓ Migration completed"
    
    echo ""
    echo "================================"
    echo "Migration Successful!"
    echo ""
    echo "Next steps:"
    echo "1. Start your development server: npm run dev"
    echo "2. Test all functionality as listed in MIGRATION_GUIDE.md"
    echo "3. If you need to rollback, use the backup file created"
    echo ""
else
    echo ""
    echo "Migration cancelled."
fi