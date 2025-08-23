import { Response } from "node-fetch";

export async function GET() {
  const apiKey = "pub_724460b3ff0d8ae0209bcd07c88a1b3621421";
  const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&country=in&language=en&category=health`;

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");

    const textResponse = await response.text();
    if (!textResponse) {
      return Response.json({ error: "Empty response from API" }, { status: 500 });
    }

    if (!response.ok) {
      return Response.json({ error: `API Error: ${response.statusText}` }, { status: response.status });
    }

    if (contentType?.includes("application/json")) {
      try {
        const data = JSON.parse(textResponse); // Parse manually to catch errors
        return Response.json(data);
      } catch (jsonError) {
        return Response.json({ error: "Invalid JSON response from API" }, { status: 500 });
      }
    }

    return Response.json({ error: "Unexpected content type from API" }, { status: 500 });
  } catch (error) {
    return Response.json({ error: "Failed to fetch news", details: error.message }, { status: 500 });
  }
}
