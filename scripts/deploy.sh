#!/bin/bash

# Whitecap Vertex AI Search - Vercel Deployment Script
# This script helps deploy your Next.js application to Vercel

echo "🚀 Whitecap Vertex AI Search - Vercel Deployment"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is already installed"
fi

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "❌ You are not logged in to Vercel. Please run: vercel login"
    exit 1
else
    echo "✅ Logged in to Vercel"
fi

# Build the application locally first
echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix the issues and try again."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure environment variables in Vercel dashboard"
echo "2. Set up your Google Cloud service account credentials"
echo "3. Test your deployed application"
echo ""
echo "🔗 Visit https://vercel.com/dashboard to manage your deployment"
