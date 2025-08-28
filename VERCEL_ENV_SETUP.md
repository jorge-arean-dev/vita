# Vercel Environment Variable Setup for Custom Domain

## Required Environment Variable

Add the following environment variable in your Vercel dashboard to ensure Open Graph images work correctly with your custom domain:

### Variable to Add:
- **Key:** `NEXT_PUBLIC_SITE_URL`
- **Value:** `https://vita-hire.com`

## Steps to Add in Vercel:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **vita** project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key:** `NEXT_PUBLIC_SITE_URL`
   - **Value:** `https://vita-hire.com`
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**

## After Adding the Variable:

1. **Trigger a new deployment** (push a commit or click "Redeploy" in Vercel)
2. Once deployed, test your custom domain share preview
3. If needed, clear cache using:
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) 
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - Enter your URL: `https://vita-hire.com`

## Why This Works:

- The `NEXT_PUBLIC_SITE_URL` environment variable ensures your metadata uses `https://vita-hire.com` as the base URL
- This makes Open Graph URLs absolute and correctly pointed to your custom domain
- Without this, it defaults to the Vercel URL (`.vercel.app`), which can cause inconsistent preview behavior

## Important Notes:

- The variable must start with `NEXT_PUBLIC_` to be accessible in the browser
- Always use the full URL including `https://`
- This change affects how all metadata URLs are generated