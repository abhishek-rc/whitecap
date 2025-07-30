# Vercel Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
1. Node.js 18+ installed
2. Vercel CLI installed (`npm install -g vercel`)
3. Vercel account (free tier available)
4. Google Cloud Project with Vertex AI enabled

### Step 1: Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from your project directory
```bash
vercel --prod
```

## 🔧 Configuration

### Environment Variables
You need to set these environment variables in your Vercel dashboard:

#### Required Variables:
- `GOOGLE_CLOUD_PROJECT_ID` - Your Google Cloud project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Base64 encoded service account key (see below)
- `VERTEX_AI_LOCATION` - Usually "global"
- `VERTEX_AI_CATALOG_ID` - Usually "default_catalog"
- `VERTEX_AI_BRANCH_ID` - Usually "default_branch"
- `VERTEX_AI_PLACEMENT_ID` - Your placement ID

#### Optional Variables:
- `NEXT_PUBLIC_APP_NAME` - "Service Foods Search"
- `NEXT_PUBLIC_APP_VERSION` - "1.0.0"

### Setting up Google Cloud Service Account for Vercel

Since Vercel doesn't support file uploads for service accounts, you need to encode your service account key:

1. **Encode your service account key:**
   ```bash
   # On Windows (using PowerShell):
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("path/to/your/service-account-key.json"))
   
   # On Linux/Mac:
   base64 -i path/to/your/service-account-key.json
   ```

2. **Set the environment variable:**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Go to "Environment Variables"
   - Add `GOOGLE_APPLICATION_CREDENTIALS` with the base64 encoded string

3. **Update your authentication code:**
   Your application will need to decode this in production. The lib files should handle this automatically.

## 📂 Project Structure for Deployment

```
vertex-ai-search-nextjs/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── product/      # Product pages
│   │   └── ...
│   ├── components/       # React components
│   └── lib/             # Utility functions
├── scripts/
│   └── deploy.sh        # Deployment script
├── vercel.json          # Vercel configuration
├── package.json
└── ...
```

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check TypeScript errors: `npm run build`
   - Verify all dependencies are installed: `npm install`

2. **Environment Variables:**
   - Ensure all required variables are set in Vercel dashboard
   - Check that service account key is properly base64 encoded

3. **API Routes:**
   - Verify your Google Cloud project has Vertex AI enabled
   - Check that your service account has proper permissions

4. **Domain Issues:**
   - Vercel provides a default domain (your-app.vercel.app)
   - You can add custom domains in the Vercel dashboard

## 🎯 Production Checklist

- [ ] All environment variables configured
- [ ] Service account key properly encoded
- [ ] Google Cloud project has Vertex AI enabled
- [ ] Build passes locally (`npm run build`)
- [ ] API routes tested
- [ ] Custom domain configured (optional)
- [ ] Analytics and monitoring set up

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)

## 📞 Support

If you encounter issues:
1. Check the Vercel deployment logs
2. Verify your Google Cloud configuration
3. Test API routes individually
4. Check the browser console for client-side errors
