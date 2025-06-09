#!/bin/bash

echo "🔍 Checking for local development features..."
echo "=================================================="
echo ""

# Initialize counters
issues_found=0

echo "❌ Checking for Local Admin References:"
if grep -rn "local-admin" src/ 2>/dev/null; then
    issues_found=$((issues_found + 1))
else
    echo "✅ None found"
fi
echo ""

echo "❌ Checking for Local Admin Login Button:"
if grep -rn "Local Admin Login" src/ 2>/dev/null; then
    issues_found=$((issues_found + 1))
else
    echo "✅ None found"
fi
echo ""

echo "❌ Checking for Development Environment Checks:"
if grep -rn "NODE_ENV.*development" src/ 2>/dev/null; then
    issues_found=$((issues_found + 1))
else
    echo "✅ None found"
fi
echo ""

echo "❌ Checking for Local Admin Function:"
if grep -rn "handleLocalAdminLogin" src/ 2>/dev/null; then
    issues_found=$((issues_found + 1))
else
    echo "✅ None found"
fi
echo ""

echo "=================================================="

if [ $issues_found -eq 0 ]; then
    echo "🎉 SUCCESS: No local development features found!"
    echo "✅ Ready for production deployment"
    echo ""
    echo "Next steps:"
    echo "1. npm run build"
    echo "2. Test with NODE_ENV=production"
    echo "3. Deploy to production"
else
    echo "🚨 WARNING: $issues_found local development feature(s) found!"
    echo "❌ NOT ready for production deployment"
    echo ""
    echo "Please remove the features listed above before deploying."
    echo "See LOCAL_DEVELOPMENT.md for detailed removal instructions."
    exit 1
fi 