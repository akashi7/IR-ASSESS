# 🚀 Deploy to Render

Quick guide to deploy the Certificate Management System to Render.

---

## Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Render Account** - Sign up at https://render.com (free)

---

## 📦 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for Render deployment"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy with Render Blueprint

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com

2. **Create New Blueprint**
   - Click **"New"** → **"Blueprint"**
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

3. **Configure Services** (Auto-detected from render.yaml)
   - ✅ **certificate-db** - PostgreSQL Database (Free tier)
   - ✅ **certificate-api** - Backend API (Free tier)
   - ✅ **certificate-frontend** - Frontend Static Site (Free tier)

4. **Click "Apply"**
   - Render will create all 3 services
   - Build process takes 5-10 minutes

### Step 3: Get Your URLs

After deployment completes, you'll get:

- **Frontend**: `https://certificate-frontend.onrender.com`
- **API**: `https://certificate-api.onrender.com`
- **Database**: Internal (only accessible by API)

---

## 🔧 Manual Deployment (Alternative)

If you prefer manual setup instead of Blueprint:

### 1. Create PostgreSQL Database

1. Click **"New"** → **"PostgreSQL"**
2. Name: `certificate-db`
3. Database: `certificate_db`
4. User: `certificate_user`
5. Plan: **Free**
6. Click **"Create Database"**

### 2. Deploy Backend API

1. Click **"New"** → **"Web Service"**
2. Connect GitHub repo
3. Configure:
   - **Name**: `certificate-api`
   - **Runtime**: Node
   - **Build Command**: `cd api && npm install`
   - **Start Command**: `cd api && npm start`
   - **Plan**: Free

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<from database service>
   JWT_SECRET=<generate random 64 char string>
   ```

5. Click **"Create Web Service"**

### 3. Deploy Frontend

1. Click **"New"** → **"Static Site"**
2. Connect GitHub repo
3. Configure:
   - **Name**: `certificate-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist/certificate-management-frontend`
   - **Plan**: Free

4. Click **"Create Static Site"**

---

## ⚙️ Environment Variables

### Backend API

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production` | Manual |
| `PORT` | `3000` | Manual |
| `DATABASE_URL` | `postgres://...` | From Database Service |
| `JWT_SECRET` | Random 64 chars | Generate with `openssl rand -hex 32` |

### Frontend

Frontend uses `environment.prod.ts` which is already configured with:
```typescript
apiUrl: 'https://certificate-api.onrender.com/api'
```

**Update** `certificate-api` with your actual Render API URL!

---

## 🔐 Security Checklist

Before going live:

- [x] DATABASE_URL configured
- [x] Strong JWT_SECRET generated
- [x] SSL enabled (automatic on Render)
- [x] Environment set to production
- [x] Frontend pointing to correct API URL

---

## 📊 Monitoring

### View Logs

```bash
# Using Render CLI
render logs certificate-api
render logs certificate-frontend
```

Or view in Render Dashboard → Service → Logs

### Health Checks

```bash
# API Health
curl https://certificate-api.onrender.com/api/health

# Should return:
# {"status":"ok","message":"Certificate Management API is running"}
```

---

## 🎯 Post-Deployment

### 1. Test the Application

1. Visit: `https://certificate-frontend.onrender.com`
2. Register a new company
3. Save API credentials
4. Create a template
5. Generate a test certificate

### 2. Update Production URL

Update `environment.prod.ts` if needed:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-ACTUAL-API-URL.onrender.com/api'
};
```

Redeploy frontend if changed.

---

## ⚠️ Free Tier Limitations

Render Free Tier:
- **Auto-sleeps** after 15 minutes of inactivity
- **Cold start** takes 30-60 seconds on first request
- **750 hours/month** limit per service
- **100GB bandwidth** per month

**Tip**: Keep services active with uptime monitoring (UptimeRobot, etc.)

---

## 🔄 Continuous Deployment

Render automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Render automatically detects and deploys!
```

---

## 🐛 Troubleshooting

### Build Failed

```bash
# Check build logs in Render Dashboard
# Common issues:
# - Missing dependencies
# - Wrong Node version
# - Build command path issues
```

### Database Connection Error

```bash
# Verify DATABASE_URL is set
# Check database service is running
# Ensure SSL is enabled for production
```

### Frontend Can't Connect to API

```bash
# Verify API URL in environment.prod.ts
# Check CORS settings in API
# Ensure API is deployed and healthy
```

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Status Page**: https://status.render.com

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Blueprint deployed or manual services created
- [ ] Environment variables configured
- [ ] Database service healthy
- [ ] API service running
- [ ] Frontend deployed
- [ ] Health check passing
- [ ] Test registration works
- [ ] Test certificate generation
- [ ] Monitor logs for errors

**You're live! 🎉**
