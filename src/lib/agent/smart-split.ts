const MAX_CHARS = 400;

function splitOnSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitOnWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function greedyCombine(chunks: string[]): string[] {
  const bubbles: string[] = [];
  let current = "";

  for (const chunk of chunks) {
    if (chunk.length > MAX_CHARS) {
      // This single chunk is too big — split by words
      const words = splitOnWords(chunk);
      for (const word of words) {
        if (current.length === 0) {
          current = word;
        } else if (current.length + 1 + word.length <= MAX_CHARS) {
          current += " " + word;
        } else {
          bubbles.push(current);
          current = word;
        }
      }
    } else if (current.length === 0) {
      current = chunk;
    } else {
      const separator = current.endsWith("\n") ? "" : " ";
      const joined = current + separator + chunk;
      if (joined.length <= MAX_CHARS) {
        current = joined;
      } else {
        bubbles.push(current);
        current = chunk;
      }
    }
  }

  if (current.length > 0) {
    bubbles.push(current);
  }

  return bubbles;
}

export function smartSplit(text: string): string[] {
  if (text.length <= MAX_CHARS) {
    return [text];
  }

  // Step 1: split on double newlines (paragraphs)
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Step 2: split each paragraph on sentences
  const sentences: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= MAX_CHARS) {
      sentences.push(paragraph);
    } else {
      sentences.push(...splitOnSentences(paragraph));
    }
  }

  // Step 3: greedily recombine up to MAX_CHARS
  return greedyCombine(sentences);
}
