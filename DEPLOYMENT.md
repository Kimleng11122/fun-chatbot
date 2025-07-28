# Vercel Deployment Guide for Fun Chatbot

## 🚀 Quick Deploy to Vercel

### Prerequisites
- Your code in a Git repository (GitHub, GitLab, or Bitbucket)
- All environment variables ready
- Firebase project configured

### Step 1: Prepare Your Repository

1. **Push your code to Git:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Verify your environment variables** are in `.env.local`:
   ```env
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-3.5-turbo
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com)** and sign up/login
2. **Click "New Project"**
3. **Import your Git repository**
4. **Configure the project:**
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings > Environment Variables**
2. Add each environment variable from your `.env.local`:

   | Variable Name | Value |
   |---------------|-------|
   | `FIREBASE_PROJECT_ID` | `your-firebase-project-id` |
   | `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"` |
   | `FIREBASE_CLIENT_EMAIL` | `your-service-account@your-project.iam.gserviceaccount.com` |
   | `OPENAI_API_KEY` | `sk-your-openai-api-key-here` |
   | `OPENAI_MODEL` | `gpt-3.5-turbo` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-firebase-project-id` |

3. **Important**: Make sure to copy the exact values from your `.env.local` file

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will automatically:
   - Install dependencies
   - Build your app
   - Deploy to their global CDN
3. Your app will be live at `https://your-app.vercel.app`

### Step 5: Configure Firebase for Production

1. **Go to Firebase Console > Authentication > Settings > Authorized domains**
2. **Add your Vercel domain**: `your-app.vercel.app`
3. **If using custom domain**: Add that too

### Step 6: Test Your Deployment

1. **Test the chat functionality**
2. **Verify Firebase connections**
3. **Check API routes work**
4. **Test user sessions**

## 🔧 Advanced Configuration

### Custom Domain Setup

1. **In Vercel Dashboard**: Go to Settings > Domains
2. **Add your domain**: Enter your custom domain
3. **Configure DNS**: Follow Vercel's DNS instructions
4. **Update Firebase**: Add your custom domain to Firebase authorized domains

### Environment Variables by Environment

You can set different environment variables for different environments:

- **Production**: Main deployment
- **Preview**: Pull request deployments
- **Development**: Local development

### Automatic Deployments

Vercel automatically deploys:
- **Main branch**: Production deployment
- **Pull requests**: Preview deployments
- **Every push**: Automatic rebuild

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check environment variables are set correctly
   - Verify all dependencies are in `package.json`
   - Check for TypeScript errors

2. **API Routes Not Working**
   - Verify environment variables are set
   - Check Firebase configuration
   - Ensure OpenAI API key is valid

3. **Firebase Connection Issues**
   - Verify Firebase project ID matches
   - Check service account credentials
   - Ensure Firestore is enabled

4. **Environment Variables Not Loading**
   - Make sure they're set in Vercel dashboard
   - Check variable names match exactly
   - Redeploy after adding variables

### Debugging

1. **Check Vercel Logs**: Go to your deployment > Functions tab
2. **Test Locally**: Run `npm run build && npm start`
3. **Check Firebase Console**: Verify data is being written

## 📊 Monitoring & Analytics

### Vercel Analytics
1. **Enable Analytics**: Go to Settings > Analytics
2. **View Metrics**: Performance, usage, errors

### Firebase Monitoring
1. **Firebase Console**: Monitor Firestore usage
2. **Authentication**: Track user sign-ups
3. **Performance**: Monitor API response times

## 💰 Cost Management

### Vercel Free Tier Limits
- **Bandwidth**: 100GB/month
- **Serverless Functions**: 100GB-hours/month
- **Builds**: 100 builds/day

### OpenAI API Costs
- Monitor usage in OpenAI dashboard
- Set up billing alerts
- Consider usage limits

### Firebase Free Tier
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Authentication**: 10K users/month

## 🔄 Continuous Deployment

### Git Workflow
1. **Make changes** locally
2. **Test** with `npm run dev`
3. **Commit and push** to Git
4. **Vercel automatically deploys**

### Branch Strategy
- `main` branch → Production
- Feature branches → Preview deployments
- Pull requests → Automatic testing

## 🎉 Success!

Your Fun Chatbot is now live on the internet! 

**Next Steps:**
- Share your app URL with friends
- Monitor usage and performance
- Add features and improvements
- Consider adding a custom domain

---

**Need Help?**
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs) 