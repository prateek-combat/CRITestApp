# Google Cloud Vision API Setup

## 1. Enable Google Cloud Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable the Vision API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"

## 2. Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `proctoring-ai-service`
4. Grant roles:
   - `Cloud Vision API Service Agent`
   - `Service Account Token Creator` (if needed)
5. Click "Done"

## 3. Generate Service Account Key

1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file

## 4. Environment Variables

Add these to your `.env.local` file:

```bash
# Google Cloud Vision API Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"your-project-id",...}'

# Alternative: Use key file path instead of inline JSON
# GOOGLE_CLOUD_KEY_PATH=/path/to/your/service-account-key.json
```

## 5. Configuration Options

### Option A: Environment Variable (Recommended for Vercel)
```bash
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

### Option B: Key File Path (For local development)
```bash
GOOGLE_CLOUD_KEY_PATH=./google-service-account.json
```

## 6. Deployment on Vercel

1. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_CLOUD_CREDENTIALS`

2. The system will automatically fall back to simulated analysis if credentials are not configured

## 7. Test the Integration

Once configured, the AI analysis will use real Google Vision API for:
- **Face Detection**: Accurate face presence and count
- **Object Detection**: Real detection of phones, books, electronics
- **Confidence Scores**: Actual ML confidence values
- **Enhanced Analysis**: Better suspicious activity detection

## 8. Cost Considerations

Google Vision API pricing (as of 2024):
- Face Detection: $1.50 per 1,000 images
- Object Detection: $1.50 per 1,000 images
- Free tier: 1,000 units/month

For a 10-minute test with 2 FPS capture:
- ~1,200 frames captured
- ~240 frames analyzed (every 5th frame)
- Cost: ~$0.72 per test attempt

## 9. Fallback Behavior

If Google Vision API is not configured or fails:
- System automatically falls back to simulated analysis
- Maintains full functionality
- Logs indicate which analysis method was used
- No service interruption 