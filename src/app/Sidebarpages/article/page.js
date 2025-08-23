'use client';

import { useEffect, useState } from "react";
import './article.css';

export default function ArticlePage() {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch news articles from /api/news
  const fetchNews = async () => {
    try {
      const res = await fetch("/api/news"); // This route will return the data from the route.js

      if (!res.ok) {
        throw new Error("Failed to fetch news.");
      }

      const data = await res.json();
      console.log("Fetched data:", data); // Log the entire response to check if the articles are there

      if (data.success && data.articles && data.articles.length > 0) {
        setNewsData(data.articles); // Set the articles fetched from the route
      } else {
        setError("No articles found.");
      }
    } catch (err) {
      console.error("❌ Error fetching news:", err.message);
      setError("Error fetching news.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component load
  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Disease Outbreaks - Top Results</h1>

      {loading && <p>Loading articles...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Render the first 30 articles */}
      {!loading && !error && newsData.length > 0 && (
        <ul className="list-disc list-inside">
          {newsData.slice(0, 30).map((article, index) => (
            <li key={index} className="mb-2">
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {article.title}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* In case there are no articles */}
      {!loading && !error && newsData.length === 0 && <p>No articles available.</p>}
    </div>
  );
}
