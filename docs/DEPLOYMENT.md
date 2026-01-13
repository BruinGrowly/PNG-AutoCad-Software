# 🚀 Deployment Guide - PNG Civil CAD

This guide covers deploying the PNG Civil CAD application to **Netlify**.

## 📋 Prerequisites

- A [Netlify account](https://app.netlify.com/signup) (free tier is sufficient)
- GitHub repository access (or Git repository)
- Node.js 20.0.0 or higher (for local testing)

---

## 🌐 Deploy to Netlify

### Method 1: Deploy from Git (Recommended)

This method enables **automatic deployments** whenever you push to your repository.

#### Step 1: Connect Your Repository

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select the **PNG-AutoCad-Software** repository

#### Step 2: Configure Build Settings

Netlify should auto-detect these settings from `netlify.toml`, but verify:

| Setting | Value |
|---------|-------|
| **Base directory** | (leave empty) |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Node version** | `20` |

#### Step 3: Deploy

1. Click **"Deploy site"**
2. Wait for the build to complete (typically 2-3 minutes)
3. Your site will be live at a URL like: `https://random-name-123456.netlify.app`

#### Step 4: Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow the instructions to configure your DNS

---

### Method 2: Manual Deploy via Netlify CLI

For quick testing or one-time deployments.

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Build Your Project

```bash
npm run build
```

#### Step 3: Deploy

```bash
# Login to Netlify
netlify login

# Deploy (first time)
netlify deploy

# Deploy to production
netlify deploy --prod
```

---

### Method 3: Drag & Drop Deploy

Perfect for quick tests without Git integration.

#### Step 1: Build Locally

```bash
npm install
npm run build
```

This creates a `dist/` folder with your production-ready files.

#### Step 2: Deploy

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag the `dist/` folder into the upload area
3. Your site will be live instantly!

> [!NOTE]
> This method doesn't support automatic updates. You'll need to manually rebuild and re-upload for changes.

---

## 🔧 Configuration Files

The following files have been set up for Netlify deployment:

### `netlify.toml`

Main configuration file containing:
- Build command and output directory
- Node.js version
- SPA redirect rules
- Security headers

### `public/_redirects`

Backup redirect file for single-page application routing. This ensures all routes redirect to `index.html` for client-side routing.

### `.nvmrc`

Specifies Node.js version `20` for consistent builds.

---

## ✅ Verify Your Deployment

After deployment, test these key features:

1. **Homepage loads** - Check the main application loads
2. **Routing works** - Navigate to different sections/pages
3. **Canvas renders** - Test the CAD drawing functionality
4. **File operations** - Try importing/exporting files
5. **Responsive design** - Test on mobile and desktop

---

## 🐛 Troubleshooting

### Build Fails

**Problem:** Build fails with dependency errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 404 Errors on Page Refresh

**Problem:** Refreshing any route except homepage gives 404

**Solution:** Verify `netlify.toml` and `public/_redirects` are present and correctly configured.

### Blank Page After Deploy

**Problem:** Site deploys but shows blank page

**Solution:**
1. Check browser console for errors
2. Verify `dist/index.html` exists after build
3. Check asset paths are relative (Vite handles this automatically)

### Build Times Out

**Problem:** Netlify build exceeds time limit

**Solution:**
- Free tier has a 300-minute/month limit
- Optimize dependencies
- Consider upgrading Netlify plan

### Node.js Version Error

**Problem:** Build fails with `SyntaxError: The requested module does not provide an export named...`

**Solution:** This means Node.js version is too old. Vite 6.x requires Node.js 20+.
1. Verify `.nvmrc` contains `20`
2. Verify `netlify.toml` has `NODE_VERSION = "20"`
3. Redeploy after updating both files

---

## 📊 Monitoring & Analytics

### Enable Analytics (Optional)

1. Go to **Site settings** → **Analytics**
2. Enable **Netlify Analytics** ($9/month)
3. View traffic, performance, and user insights

### Environment Variables

For production-only configuration:

1. Go to **Site settings** → **Environment variables**
2. Add variables (e.g., `VITE_API_URL`)
3. Rebuild site for changes to take effect

---

## 🔄 Continuous Deployment

Once connected to Git, Netlify automatically:

✅ Builds on every push to main branch  
✅ Creates deploy previews for pull requests  
✅ Rolls back to previous versions if needed  

### Branch Deploys

Deploy different branches:

1. **Site settings** → **Build & deploy** → **Deploy contexts**
2. Enable branch deploys for testing features

---

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router with Netlify](https://docs.netlify.com/routing/redirects/rewrites-proxies/)

---

## 🎉 Success!

Your PNG Civil CAD application is now live and accessible worldwide! 

**Next Steps:**
- Share your deployment URL
- Set up a custom domain
- Enable HTTPS (automatic on Netlify)
- Monitor usage and performance

> [!TIP]
> Bookmark your Netlify dashboard for easy access to deployment logs, analytics, and settings.
