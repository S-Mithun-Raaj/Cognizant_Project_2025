// src/Utils/summarizer.js
import { SummarizerManager } from "node-summarizer";

/**
 * Summarize long text into N sentences (default 5).
 * Runs on the server (API route), not in the client.
 */
export async function summarize(text, sentences = 5) {
  const summarizer = new SummarizerManager(text, sentences);
  const result = await summarizer.getSummaryByFrequency();
  return result.summary || "";
}
