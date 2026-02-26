# EEG Analysis Platform

## Quick Start Guide for Real File Analysis

### Step 1: Add Gemini API Key

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### Step 2: Upload EEG File

Supported formats:
- `.edf` - European Data Format
- `.csv` - Comma-separated (channels as columns)
- `.txt` - Text files
- `.mat` - MATLAB format (basic support)

**Testing**: Use the included `public/sample-eeg-data.csv` file to test the system. It contains 10 EEG channels with ~200ms of sample data.

### Step 3: Run Analysis

1. Navigate to any project
2. Drag and drop your EEG file or click to browse
3. Fill in patient information
4. Click "Run AI Analysis"

The system will:
- Parse your EEG file
- Extract features from all channels
- Send to Gemini AI for analysis
- Generate visualizations and risk assessment

### Demo Mode

No EEG file? Click "Run Demo Analysis" to see the platform in action with simulated data.

### Fallback Behavior

If Gemini API key is not provided, the system automatically falls back to rule-based analysis using statistical thresholds.

## CSV Format Example

```csv
timestamp,Fp1,Fp2,F7,F3,Fz,F4,F8
0.000,12.3,15.6,10.2,8.9,11.4,9.7,13.1
0.004,13.1,14.8,11.0,9.5,10.9,10.2,12.8
```

Or without timestamp:

```csv
Fp1,Fp2,F7,F3,Fz,F4,F8
12.3,15.6,10.2,8.9,11.4,9.7,13.1
13.1,14.8,11.0,9.5,10.9,10.2,12.8
```

## Troubleshooting

**File not parsing?**
- Ensure CSV has channel names in first row
- Check file encoding (UTF-8 recommended)
- Verify data is numeric

**AI analysis failing?**
- Check Gemini API key in `.env.local`
- Verify API key has proper permissions
- System will automatically use rule-based analysis as fallback

**Visualizations not showing?**
- Refresh the page
- Check browser console for errors
- Ensure at least 3 channels in input file

## Development

```bash
# Install dependencies
npm install

# Run Convex backend
npx convex dev

# Run Next.js frontend
npm run dev
```

## Architecture

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Convex (serverless functions + real-time DB)
- **AI**: Google Gemini Pro API
- **Auth**: Clerk
- **File Parsing**: Custom browser-based parsers

## File Processing Pipeline

1. **Upload** → Browser reads file (no server upload needed)
2. **Parse** → Extract channels, sampling rate
3. **Feature Extraction** → Calculate variance, amplitude, zero-crossings
4. **AI Analysis** → Gemini AI assesses features
5. **Visualization** → Generate charts from processed data
6. **Storage** → Save results in Convex DB
