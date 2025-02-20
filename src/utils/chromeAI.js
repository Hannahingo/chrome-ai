const isTextLanguageDetectorAvailable = () => {
  return 'ai' in self && 'languageDetector' in self.ai
}

const isSummarizationAvailable = () => {
  return 'ai' in self && 'summarizer' in self.ai
}

const isTranslationAvailable = () => {
  return 'ai' in self && 'translator' in self.ai
}

// Initialize language detector
const initializeDetector = async () => {
  const languageDetectorCapabilities = await self.ai.languageDetector.capabilities();
  const canDetect = languageDetectorCapabilities.capabilities;

  if (canDetect === 'no') {
    throw new Error('Language detector is not usable on this device');
  }

  if (canDetect === 'readily') {
    return await self.ai.languageDetector.create();
  } else {
    // Need to download the model
    const detector = await self.ai.languageDetector.create({
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
        });
      },
    });
    await detector.ready;
    return detector;
  }
}

// Initialize translator
const initializeTranslator = async (sourceLanguage, targetLanguage) => {
  const translatorCapabilities = await self.ai.translator.capabilities();
  const canTranslate = await translatorCapabilities.languagePairAvailable(sourceLanguage, targetLanguage);

  if (canTranslate === 'no') {
    throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} is not supported`);
  }

  if (canTranslate === 'readily') {
    return await self.ai.translator.create({
      sourceLanguage,
      targetLanguage,
    });
  } else {
    // Need to download the model
    const translator = await self.ai.translator.create({
      sourceLanguage,
      targetLanguage,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
        });
      },
    });
    await translator.ready;
    return translator;
  }
}

// Initialize summarizer
const initializeSummarizer = async (options = {}) => {
  const defaultOptions = {
    type: 'key-points',
    format: 'markdown',
    length: 'medium',
  }

  const summarizeOptions = { ...defaultOptions, ...options }
  const capabilities = await self.ai.summarizer.capabilities();

  if (capabilities.available === 'no') {
    throw new Error('Summarization is not available on this device');
  }

  if (capabilities.available === 'readily') {
    return await self.ai.summarizer.create(summarizeOptions);
  } else {
    // Need to download the model
    const summarizer = await self.ai.summarizer.create(summarizeOptions);
    
    // Return a promise that resolves when the model is ready
    return new Promise((resolve, reject) => {
      summarizer.addEventListener('downloadprogress', (e) => {
        console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
      });

      summarizer.ready
        .then(() => resolve(summarizer))
        .catch(reject);
    });
  }
}

// Language Detection
export const detectLanguage = async (text) => {
  if (!isTextLanguageDetectorAvailable()) {
    throw new Error('Language detection API is not available');
  }

  try {
    const detector = await initializeDetector();
    const results = await detector.detect(text);
    
    // Get the most confident result
    const topResult = results[0];
    
    if (!topResult) {
      throw new Error('Could not detect language');
    }

    // Only return languages with confidence > 0.5
    if (topResult.confidence < 0.5) {
      throw new Error('Language detection confidence too low');
    }

    // Check if the detected language is supported
    const capabilities = await self.ai.languageDetector.capabilities();
    const languageSupport = await capabilities.languageAvailable(topResult.detectedLanguage);
    
    if (languageSupport !== 'readily') {
      throw new Error(`Language ${topResult.detectedLanguage} is not supported`);
    }

    return topResult.detectedLanguage;
  } catch (error) {
    console.error('Language detection error:', error);
    throw error;
  }
}

// Text Summarization
export const summarizeText = async (text, options = {}) => {
  if (!isSummarizationAvailable()) {
    throw new Error('Summarization API is not available');
  }

  try {
    // Clean the input text (remove HTML if present)
    const cleanText = text.replace(/<[^>]*>/g, '');

    // Initialize the summarizer with options
    const summarizer = await initializeSummarizer({
      sharedContext: options.context,
      type: options.type || 'key-points',
      format: options.format || 'markdown',
      length: options.length || 'medium',
    });

    // Get the summary
    const summary = await summarizer.summarize(cleanText, {
      context: options.context
    });

    if (!summary) {
      throw new Error('Failed to generate summary');
    }

    return summary;
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
}

// Streaming summarization
export const summarizeTextStreaming = async function* (text, options = {}) {
  if (!isSummarizationAvailable()) {
    throw new Error('Summarization API is not available');
  }

  try {
    // Clean the input text
    const cleanText = text.replace(/<[^>]*>/g, '');

    // Initialize the summarizer
    const summarizer = await initializeSummarizer({
      sharedContext: options.context,
      type: options.type || 'key-points',
      format: options.format || 'markdown',
      length: options.length || 'medium',
    });

    // Get the streaming summary
    const stream = await summarizer.summarizeStreaming(cleanText, {
      context: options.context
    });

    let previousLength = 0;
    for await (const segment of stream) {
      const newContent = segment.slice(previousLength);
      previousLength = segment.length;
      yield newContent;
    }
  } catch (error) {
    console.error('Streaming summarization error:', error);
    throw error;
  }
}

// Translation
export const translateText = async (text, targetLanguage, sourceLanguage) => {
  if (!isTranslationAvailable()) {
    throw new Error('Translation API is not available');
  }
  
  try {
    // If source language isn't provided, detect it
    const actualSourceLanguage = sourceLanguage || await detectLanguage(text);
    
    // Initialize translator with source and target languages
    const translator = await initializeTranslator(actualSourceLanguage, targetLanguage);
    
    // Perform the translation
    const translatedText = await translator.translate(text);
    
    if (!translatedText) {
      throw new Error('Translation failed');
    }

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

