import { SummarizerManager } from "node-summarizer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const summarizer = new SummarizerManager(text, 5); // 5 sentences summary
    const summaryObject = await summarizer.getSummaryByFrequency();

    res.status(200).json({
      summary: summaryObject.summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
