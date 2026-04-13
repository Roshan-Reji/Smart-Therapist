import { pipeline, env } from "@huggingface/transformers";

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const PRIMARY_MODEL = "onnx-community/whisper-base.en";
const FALLBACK_MODEL = "onnx-community/whisper-tiny.en";

let transcriber: any = null;
let fallbackTranscriber: any = null;
let isLoading = false;
let isFallbackLoading = false;

const normalizeText = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, "")
    .split(/\s+/)
    .filter(Boolean);

const buildLevenshteinMatrix = (reference: string[], spoken: string[]): number[][] => {
  const rows = reference.length + 1;
  const cols = spoken.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = reference[i - 1] === spoken[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution / match
      );
    }
  }

  return matrix;
};

const extractWordDiff = (reference: string[], spoken: string[], matrix: number[][]) => {
  const matchedWords: string[] = [];
  const missedWords: string[] = [];
  const extraWords: string[] = [];

  let i = reference.length;
  let j = spoken.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && matrix[i][j] === matrix[i - 1][j - 1] && reference[i - 1] === spoken[j - 1]) {
      matchedWords.unshift(reference[i - 1]);
      i -= 1;
      j -= 1;
    } else if (
      i > 0 &&
      j > 0 &&
      matrix[i][j] === matrix[i - 1][j - 1] + 1
    ) {
      // substitution
      missedWords.unshift(reference[i - 1]);
      extraWords.unshift(spoken[j - 1]);
      i -= 1;
      j -= 1;
    } else if (i > 0 && matrix[i][j] === matrix[i - 1][j] + 1) {
      // deletion from spoken => missed word
      missedWords.unshift(reference[i - 1]);
      i -= 1;
    } else if (j > 0 && matrix[i][j] === matrix[i][j - 1] + 1) {
      // insertion => extra word spoken
      extraWords.unshift(spoken[j - 1]);
      j -= 1;
    } else {
      // fallback to break potential infinite loops
      break;
    }
  }

  return { matchedWords, missedWords, extraWords };
};

export const initializeSpeechRecognition = async (
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (transcriber || isLoading) return;
  
  isLoading = true;
  console.log("Initializing speech recognition model...");

  try {
    transcriber = await pipeline(
      "automatic-speech-recognition",
      PRIMARY_MODEL,
      {
        device: "webgpu",
        progress_callback: (progress: any) => {
          if (progress.progress && onProgress) {
            onProgress(Math.round(progress.progress));
          }
        },
      }
    );
    console.log(`Speech recognition model loaded successfully (${PRIMARY_MODEL})`);
  } catch (error) {
    console.error("Error loading speech recognition model:", error);
    // Fallback to CPU if WebGPU not available
    try {
      transcriber = await pipeline(
        "automatic-speech-recognition",
        PRIMARY_MODEL,
        {
          progress_callback: (progress: any) => {
            if (progress.progress && onProgress) {
              onProgress(Math.round(progress.progress));
            }
          },
        }
      );
      console.log(`Speech recognition model loaded on CPU (${PRIMARY_MODEL})`);
    } catch (fallbackError) {
      console.error("Primary model failed entirely, trying tiny fallback:", fallbackError);
      transcriber = await pipeline(
        "automatic-speech-recognition",
        FALLBACK_MODEL,
        {
          progress_callback: (progress: any) => {
            if (progress.progress && onProgress) {
              onProgress(Math.round(progress.progress));
            }
          },
        }
      );
      console.log(`Speech recognition model loaded using fallback (${FALLBACK_MODEL})`);
    }
  } finally {
    isLoading = false;
  }
};

const ensureFallbackModel = async (): Promise<void> => {
  if (fallbackTranscriber || isFallbackLoading) return;

  isFallbackLoading = true;
  try {
    fallbackTranscriber = await pipeline(
      "automatic-speech-recognition",
      FALLBACK_MODEL,
      {
        progress_callback: (progress: any) => {
          if (progress.progress) {
            console.log("Fallback model load progress", progress.progress);
          }
        },
      }
    );
    console.log(`Fallback speech recognition model ready (${FALLBACK_MODEL})`);
  } catch (error) {
    console.error("Failed to load fallback speech model:", error);
  } finally {
    isFallbackLoading = false;
  }
};

const shouldRetryTranscription = (text?: string): boolean => {
  if (!text) return true;
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim();
  if (!normalized) return true;

  const words = normalized.split(/\s+/);
  if (words.length < 2) return true;

  const suspiciousOutputs = new Set(["you", "yeah", "yep", "uh", "um"]);
  if (words.length <= 3 && words.every((word) => suspiciousOutputs.has(word))) {
    return true;
  }

  return false;
};

export const transcribeAudio = async (
  audioData: Float32Array | string
): Promise<{ text: string; confidence: number }> => {
  if (!transcriber) {
    await initializeSpeechRecognition();
  }

  if (!transcriber) {
    throw new Error("Speech recognition model not initialized");
  }

  try {
    let result = await transcriber(audioData);
    console.log("Transcription result:", result);

    if (shouldRetryTranscription(result.text)) {
      console.warn("Primary model uncertain, attempting fallback transcription...");
      await ensureFallbackModel();
      if (fallbackTranscriber) {
        const fallbackResult = await fallbackTranscriber(audioData);
        console.log("Fallback transcription result:", fallbackResult);
        if (!shouldRetryTranscription(fallbackResult.text)) {
          result = fallbackResult;
        }
      }
    }

    const cleanedText = result.text?.trim() || "";
    const confidence = shouldRetryTranscription(cleanedText) ? 0.5 : 0.85;

    return {
      text: cleanedText,
      confidence,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
};

export const analyzePronunciation = (
  transcribedText: string,
  targetText: string
): {
  accuracy: number;
  matchedWords: string[];
  missedWords: string[];
  extraWords: string[];
  feedback: string;
} => {
  const targetWords = normalizeText(targetText);
  const spokenWords = normalizeText(transcribedText);

  if (targetWords.length === 0) {
    return {
      accuracy: 0,
      matchedWords: [],
      missedWords: [],
      extraWords: spokenWords,
      feedback: "No target phrase provided.",
    };
  }

  const matrix = buildLevenshteinMatrix(targetWords, spokenWords);
  const { matchedWords, missedWords, extraWords } = extractWordDiff(targetWords, spokenWords, matrix);

  const maxLen = Math.max(targetWords.length, spokenWords.length) || 1;
  const distance = matrix[targetWords.length][spokenWords.length];
  const accuracy = Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));

  let feedback = "";
  if (accuracy >= 90) {
    feedback = "Excellent pronunciation! Keep up the great work! 🌟";
  } else if (accuracy >= 70) {
    feedback = "Good job! A few words need more practice. 👍";
  } else if (accuracy >= 50) {
    feedback = "Nice try! Let's practice those tricky words again. 💪";
  } else {
    feedback = "Keep practicing! You're getting better every time. 🎯";
  }

  return {
    accuracy,
    matchedWords,
    missedWords,
    extraWords,
    feedback,
  };
};

export const isModelLoaded = (): boolean => {
  return transcriber !== null;
};
