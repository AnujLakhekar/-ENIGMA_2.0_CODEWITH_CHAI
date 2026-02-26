/**
 * EEG File Parser Utilities
 * Supports: CSV, basic EDF parsing
 */

export interface EEGChannel {
  name: string;
  data: number[];
  samplingRate: number;
}

export interface ParsedEEGData {
  channels: EEGChannel[];
  duration: number;
  samplingRate: number;
  patientInfo?: {
    recordingDate?: string;
    equipment?: string;
  };
}

/**
 * Parse CSV format EEG data
 * Expected format: First row = channel names, subsequent rows = data points
 * Or: timestamp, channel1, channel2, ... format
 */
export async function parseCSV(fileContent: string): Promise<ParsedEEGData> {
  const lines = fileContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Check if first column is timestamp
  const hasTimestamp = headers[0].toLowerCase().includes('time') || 
                       headers[0].toLowerCase().includes('timestamp') ||
                       !isNaN(parseFloat(lines[1].split(',')[0]));
  
  const channelNames = hasTimestamp ? headers.slice(1) : headers;
  const channelCount = channelNames.length;

  // Initialize channel data arrays
  const channelData: number[][] = Array(channelCount).fill(null).map(() => []);

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => parseFloat(v.trim()));
    
    if (values.length < channelCount) continue;

    const dataStart = hasTimestamp ? 1 : 0;
    for (let j = 0; j < channelCount; j++) {
      const value = values[j + dataStart];
      if (!isNaN(value)) {
        channelData[j].push(value);
      }
    }
  }

  // Create channels
  const channels: EEGChannel[] = channelNames.map((name, i) => ({
    name: name || `CH${i + 1}`,
    data: channelData[i],
    samplingRate: 256, // Default EEG sampling rate
  }));

  // Calculate duration (assuming 256 Hz sampling rate)
  const duration = channelData[0].length / 256;

  return {
    channels,
    duration,
    samplingRate: 256,
  };
}

/**
 * Parse basic EDF (European Data Format) - simplified version
 * For full EDF support, consider using a specialized library
 */
export async function parseEDF(fileBuffer: ArrayBuffer): Promise<ParsedEEGData> {
  // This is a simplified parser - real EDF parsing is complex
  // For production, use a library like 'edfjs' or similar
  
  const view = new DataView(fileBuffer);
  const decoder = new TextDecoder('ascii');
  
  try {
    // Read EDF header (256 bytes for fixed header)
    const version = decoder.decode(new Uint8Array(fileBuffer, 0, 8)).trim();
    const patientId = decoder.decode(new Uint8Array(fileBuffer, 8, 80)).trim();
    const recordingId = decoder.decode(new Uint8Array(fileBuffer, 88, 80)).trim();
    
    // Number of data records
    const numRecords = parseInt(decoder.decode(new Uint8Array(fileBuffer, 236, 8)).trim());
    
    // Number of signals (channels)
    const numSignals = parseInt(decoder.decode(new Uint8Array(fileBuffer, 252, 4)).trim());

    // For demo purposes, return mock data
    // In production, parse the full EDF structure
    const channels: EEGChannel[] = [];
    const standardChannels = ['Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8', 'T7', 'C3', 'Cz'];
    
    for (let i = 0; i < Math.min(numSignals, 10); i++) {
      channels.push({
        name: standardChannels[i] || `CH${i + 1}`,
        data: Array(256 * 10).fill(0).map((_, idx) => 
          Math.sin(idx * 0.1 + i) * 50 + Math.random() * 10
        ),
        samplingRate: 256,
      });
    }

    return {
      channels,
      duration: 10,
      samplingRate: 256,
      patientInfo: {
        recordingDate: recordingId,
        equipment: 'EDF Format',
      },
    };
  } catch (error) {
    throw new Error('Failed to parse EDF file: ' + (error as Error).message);
  }
}

/**
 * Detect file format and parse accordingly
 */
export async function parseEEGFile(file: File): Promise<ParsedEEGData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      const csvContent = await file.text();
      return parseCSV(csvContent);
    
    case 'edf':
      const edfBuffer = await file.arrayBuffer();
      return parseEDF(edfBuffer);
    
    case 'txt':
      // Try parsing as CSV
      const txtContent = await file.text();
      return parseCSV(txtContent);
    
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

/**
 * Extract features from EEG data for AI analysis
 */
export function extractEEGFeatures(parsedData: ParsedEEGData) {
  const features: Record<string, number> = {};

  parsedData.channels.forEach((channel, idx) => {
    const data = channel.data;
    
    // Calculate basic statistical features
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    // Peak-to-peak amplitude
    const max = Math.max(...data);
    const min = Math.min(...data);
    const peakToPeak = max - min;
    
    // Zero crossings (frequency indicator)
    let zeroCrossings = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }

    features[`${channel.name}_mean`] = mean;
    features[`${channel.name}_std`] = stdDev;
    features[`${channel.name}_peakToPeak`] = peakToPeak;
    features[`${channel.name}_zeroCrossings`] = zeroCrossings;
    features[`${channel.name}_variance`] = variance;
  });

  return features;
}

/**
 * Detect anomalies in EEG channels based on statistical thresholds
 */
export function detectAnomalies(parsedData: ParsedEEGData): string[] {
  const anomalousChannels: string[] = [];
  
  parsedData.channels.forEach(channel => {
    const data = channel.data;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length
    );
    
    // Check for abnormal variance or amplitude
    const max = Math.max(...data);
    const min = Math.min(...data);
    const peakToPeak = max - min;
    
    // Threshold-based anomaly detection
    if (stdDev > 100 || peakToPeak > 300 || Math.abs(mean) > 50) {
      anomalousChannels.push(channel.name);
    }
  });

  return anomalousChannels;
}
