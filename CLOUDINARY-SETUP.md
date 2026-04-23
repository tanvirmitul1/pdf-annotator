# Cloudinary Storage Setup

Cloudinary is now integrated! Here's how to use it:

## Cloudinary Free Tier
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month
- Perfect for PDF storage

---

## Local Development

Add to your `.env`:

```bash
STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=dyeazimxs
CLOUDINARY_API_KEY=986478547731215
CLOUDINARY_API_SECRET=EjYdeaxCRrC02h1fHXrSJMtoZSQ
```

---

## Vercel Deployment

Add these environment variables in Vercel dashboard:

```bash
STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=dyeazimxs
CLOUDINARY_API_KEY=986478547731215
CLOUDINARY_API_SECRET=EjYdeaxCRrC02h1fHXrSJMtoZSQ
```

---

## How It Works

- PDFs are uploaded as `raw` resource type
- Images are uploaded as `image` resource type
- Files are stored in `pdf-annotator/{userId}/{docId}/{filename}` structure
- URLs are automatically signed and secure
- No need to manage file system or S3 buckets

---

## Testing

1. Update your `.env` with Cloudinary credentials
2. Restart dev server: `pnpm dev:all`
3. Upload a PDF
4. Check Cloudinary dashboard to see the uploaded file

---

## Vercel Deployment Steps

1. Push code to GitHub:
```bash
git add .
git commit -m "Add Cloudinary storage support"
git push origin main
```

2. Add environment variables in Vercel:
   - Go to your project → Settings → Environment Variables
   - Add the 4 Cloudinary variables above

3. Redeploy (automatic on push or manual in Vercel dashboard)

4. Test upload on your Vercel URL

---

## Switching Storage Drivers

You can switch between storage drivers by changing `STORAGE_DRIVER`:

- `local` - Local filesystem (dev only, doesn't work on Vercel)
- `cloudinary` - Cloudinary (works everywhere)
- `s3` - AWS S3
- `r2` - Cloudflare R2

Just update the env var and restart the app.
