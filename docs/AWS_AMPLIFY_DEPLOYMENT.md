# AWS Amplify Deployment Guide

> **Note**: The website has been moved to a separate repository/project. This guide is kept for historical reference. For current deployment, refer to the website's separate repository.

This guide explains how to deploy the WyaparPay website to AWS Amplify.

## ✅ Compatibility

**Yes, AWS Amplify fully supports your Next.js 14 website!**

- ✅ Next.js 14 with App Router
- ✅ TypeScript
- ✅ Server-Side Rendering (SSR)
- ✅ Static Site Generation (SSG)
- ✅ PWA (Progressive Web App)
- ✅ Environment Variables
- ✅ Custom Build Configuration

## 📋 Prerequisites

1. **AWS Account** with Amplify access
2. **GitHub/GitLab/Bitbucket** repository (your code is already in a repo)
3. **Backend API** deployed and accessible (for production API URL)

## 🚀 Deployment Steps

### Option 1: Deploy via AWS Amplify Console (Recommended)

1. **Login to AWS Console**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Sign in with your AWS account

2. **Create New App**
   - Click "New app" → "Host web app"
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your repository: `WyaparPay/Wyapar`
   - Select the branch: `website` (or your preferred branch)
   
3. **Configure Monorepo Settings** ⚠️ **IMPORTANT**
   - ✅ **Check the box**: "My app is a monorepo"
   - **Enter the root directory**: `frontend/website`
   - This tells Amplify where your Next.js app is located within the monorepo
   - **Important**: When you check the monorepo box, the `amplify.yml` file MUST use the `applications` key format (which is already configured)
   - The `appRoot: frontend/website` in `amplify.yml` matches the root directory you enter here

4. **Configure Build Settings**
   - AWS Amplify will auto-detect Next.js from the `frontend/website` directory
   - The `amplify.yml` file in the repository root will be used automatically
   - The build configuration uses the `applications` format required for monorepos:
     ```yaml
     version: 1
     applications:
       - appRoot: frontend/website
         frontend:
           phases:
             preBuild:
               commands:
                 - npm ci
             build:
               commands:
                 - npm run build
           artifacts:
             baseDirectory: .
             files:
               - '**/*'
     ```
   - **Note**: The `appRoot` in `amplify.yml` should match the root directory you entered in step 3

5. **Configure Environment Variables**
   - In Amplify Console, go to "App settings" → "Environment variables"
   - Add the following variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
     NEXT_PUBLIC_API_TIMEOUT=30000
     NEXT_PUBLIC_ENV=production
     ```
   - **Important**: Replace `https://your-backend-api.com` with your actual backend API URL

6. **Review and Deploy**
   - Review the configuration
   - Click "Save and deploy"
   - Amplify will build and deploy your app

### Option 2: Deploy via AWS CLI

1. **Install AWS CLI and Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   aws configure
   ```

2. **Initialize Amplify**
   ```bash
   amplify init
   ```

3. **Add Hosting**
   ```bash
   amplify add hosting
   ```

4. **Deploy**
   ```bash
   amplify publish
   ```

## ⚙️ Configuration Details

### Build Configuration (`amplify.yml`)

The `amplify.yml` file is already configured in the root directory:

- **Pre-build**: Installs dependencies using `npm ci` (faster, more reliable)
- **Build**: Runs `npm run build` to create production build
- **Artifacts**: Outputs from `frontend/website/.next` directory
- **Cache**: Caches `node_modules` and `.next/cache` for faster builds

### Environment Variables

Required environment variables in AWS Amplify Console:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.wyaparpay.com/api/v1` |
| `NEXT_PUBLIC_API_TIMEOUT` | API request timeout (ms) | `30000` |
| `NEXT_PUBLIC_ENV` | Environment name | `production` |

**Optional variables:**
- `NEXT_PUBLIC_AWS_REGION` - AWS region for S3 (if using profile images)
- `NEXT_PUBLIC_AWS_S3_BUCKET` - S3 bucket name for profile images

### Custom Domain Setup

1. In Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Enter your domain name
4. Follow the DNS configuration steps
5. SSL certificate is automatically provisioned by AWS

## 🔧 Build Optimization

### Current Build Settings

The `amplify.yml` is optimized for:
- ✅ Fast builds with dependency caching
- ✅ Next.js cache preservation
- ✅ Monorepo structure support

### Additional Optimizations (Optional)

If you want to optimize further, you can modify `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend/website
        - npm ci --prefer-offline --no-audit
        - npm run type-check  # Optional: Run type checking
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/website/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/website/node_modules/**/*
      - frontend/website/.next/cache/**/*
      - frontend/website/.next/standalone/**/*  # If using standalone output
```

## 🔄 Continuous Deployment

AWS Amplify automatically:
- ✅ Detects pushes to your connected branch
- ✅ Triggers new builds
- ✅ Deploys on successful builds
- ✅ Provides preview deployments for pull requests

### Branch Strategy

- **Main/Production Branch**: Auto-deploys to production
- **Other Branches**: Creates preview deployments
- **Pull Requests**: Creates preview deployments with unique URLs

## 🐛 Troubleshooting

### Build Failures

1. **Check Build Logs**
   - Go to Amplify Console → Your App → Build history
   - Click on failed build to see detailed logs

2. **Common Issues**

   **Issue**: `Can't find required-server-files.json in build output directory`
   - **Error**: Build succeeds but deployment fails with this error
   - **Cause**: AWS Amplify can't find Next.js SSR files in the expected location
   - **Solution**: Ensure `amplify.yml` has correct artifacts configuration:
     ```yaml
     artifacts:
       baseDirectory: .
       files:
         - '**/*'
         - '.next/**/*'
     ```
   - **Solution**: Verify the file exists after build: `ls -la .next/required-server-files.json`
   - **Note**: The `**/*` pattern should include everything, but being explicit helps
   - **Alternative**: If issue persists, check AWS Amplify Console → App settings → Build settings to ensure Next.js is properly detected

   **Issue**: `Monorepo spec provided without "applications" key` ⚠️
   - **Error**: `CustomerError: Monorepo spec provided without "applications" key`
   - **Cause**: You checked the monorepo box but `amplify.yml` doesn't use the `applications` format
   - **Solution**: Ensure your `amplify.yml` uses the `applications` key format (see updated file)
   - **Solution**: The `amplify.yml` should have:
     ```yaml
     version: 1
     applications:
       - appRoot: frontend/website
         frontend:
           ...
     ```
   - **Note**: If you don't want to use the monorepo checkbox, you can uncheck it and use the simpler format without `applications`

   **Issue**: `npm ci` fails
   - **Solution**: Ensure `package-lock.json` is committed
   - **Solution**: Check Node.js version (should be 18+)

   **Issue**: Build timeout
   - **Solution**: Increase build timeout in Amplify settings
   - **Solution**: Optimize build process (remove unnecessary steps)

   **Issue**: Environment variables not found
   - **Solution**: Verify variables are set in Amplify Console
   - **Solution**: Ensure variables start with `NEXT_PUBLIC_` for client-side access

   **Issue**: API connection errors
   - **Solution**: Verify `NEXT_PUBLIC_API_URL` is correct
   - **Solution**: Check CORS settings on backend API
   - **Solution**: Ensure backend API is accessible from internet

   **Issue**: Build fails with ESLint warnings
   - **Error**: Build fails even though only ESLint warnings are shown (no errors)
   - **Cause**: Next.js by default fails builds on any ESLint issues (warnings or errors)
   - **Solution**: Configure `next.config.js` to ignore ESLint during builds:
     ```js
     eslint: {
       ignoreDuringBuilds: true,
     },
     ```
   - **Note**: This is a common practice for production builds. You can still run `npm run lint` locally to check for issues
   - **Alternative**: Fix all ESLint warnings (replace `any` types, remove console statements, etc.)

### Performance Issues

1. **Enable Next.js Image Optimization**
   - Already configured in `next.config.js`
   - AWS Amplify supports Next.js Image Optimization automatically

2. **Enable Caching**
   - Amplify automatically caches static assets
   - Configure custom cache headers if needed

3. **Monitor Build Times**
   - Check build logs for slow steps
   - Use caching to speed up subsequent builds

## 📊 Monitoring

### Amplify Console Features

- **Build History**: View all builds and their status
- **Deployment History**: Track deployments
- **Logs**: Access build and runtime logs
- **Metrics**: Monitor app performance
- **Alerts**: Set up notifications for build failures

### Next.js Analytics (Optional)

Consider adding Next.js Analytics:
```bash
npm install @vercel/analytics
```

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit sensitive values
   - Use Amplify Console for environment variables
   - Use AWS Secrets Manager for highly sensitive data

2. **API Security**
   - Ensure backend API has proper CORS configuration
   - Use HTTPS for all API calls
   - Implement rate limiting on backend

3. **Content Security Policy**
   - Configure CSP headers in `next.config.js` if needed
   - Review external image domains in `next.config.js`

## 📝 Next Steps After Deployment

1. **Test the Deployment**
   - Visit the Amplify-provided URL
   - Test all features (login, recharge, etc.)
   - Verify API connectivity

2. **Set Up Custom Domain**
   - Add your domain in Amplify Console
   - Configure DNS records
   - Wait for SSL certificate provisioning

3. **Configure Monitoring**
   - Set up CloudWatch alarms
   - Configure build notifications
   - Set up error tracking (optional)

4. **Optimize Performance**
   - Enable CDN caching
   - Monitor Core Web Vitals
   - Optimize images and assets

## 🎯 Best Practices

1. **Use Environment-Specific Variables**
   - Different values for staging and production
   - Use Amplify's environment management

2. **Enable Preview Deployments**
   - Test changes before merging
   - Share preview URLs with team

3. **Monitor Build Costs**
   - Amplify has a free tier
   - Monitor usage in AWS Console

4. **Keep Dependencies Updated**
   - Regularly update `package.json`
   - Test builds after updates

## 📚 Additional Resources

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Amplify Console User Guide](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)

## ✅ Checklist

Before deploying:

- [ ] Backend API is deployed and accessible
- [ ] Environment variables are configured
- [ ] `amplify.yml` is in the root directory
- [ ] `package-lock.json` is committed
- [ ] All dependencies are in `package.json`
- [ ] Build works locally (`npm run build`)
- [ ] Git repository is connected to Amplify
- [ ] Custom domain is ready (if applicable)

---

**Ready to deploy?** Follow the steps above and your Next.js website will be live on AWS Amplify! 🚀

