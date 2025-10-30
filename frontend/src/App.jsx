import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; // Import CSS file

// Backend API base URL from .env
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export default function App() {
  // -------------------- State variables --------------------
  const [url, setUrl] = useState("");           // input field
  const [error, setError] = useState("");       // error message
  const [shortUrl, setShortUrl] = useState(""); // generated short URL
  const [loading, setLoading] = useState(false);
  const [allUrls, setAllUrls] = useState([]);   // list of all URLs
  const [listLoading, setListLoading] = useState(false);

  // -------------------- Fetch all URLs --------------------
  const fetchAllUrls = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/showall`);
      // Add computed shortUrl field for easy access
      const mapped = res.data.map((doc) => ({
        ...doc,
        shortUrl: `${API_BASE}/${doc.code}`,
      }));
      setAllUrls(mapped.reverse()); // show newest first
    } catch (err) {
      console.error("Error fetching all URLs:", err);
      setError("Unable to fetch URLs. Try again later.");
    } finally {
      setListLoading(false);
    }
  };

  // Fetch all URLs when component mounts
  useEffect(() => {
    fetchAllUrls();
  }, []);

  // -------------------- Shorten a new URL --------------------
  const handleShorten = async () => {
    setError("");
    const trimmed = url.trim();

    if (!trimmed) {
      setError("Please enter a valid URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/geturl`, {
        params: { url: trimmed },
      });
      const newShort = res.data.shortUrl || `${API_BASE}/${res.data.code}`;
      setShortUrl(newShort);
      setUrl("");
      await fetchAllUrls(); // Refresh list
    } catch (err) {
      console.error(err);
      setError(err.response?.data || "Server error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Copy short URL --------------------
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch {
      alert("Copy failed.");
    }
  };

  // -------------------- UI --------------------
  return (
    <div className="container">
      <h1>URL Shortener</h1>

      {/* Input box and button */}
      <div className="input-group">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a long URL (e.g., https://example.com)"
          disabled={loading}
        />
        <button onClick={handleShorten} disabled={loading}>
          {loading ? "Shortening..." : "Shorten"}
        </button>
      </div>

      {/* Error message */}
      {error && <p className="error">{error}</p>}

      {/* Shortened URL result */}
      {shortUrl && (
        <p className="short-url">
          <strong>Shortened URL:</strong>{" "}
          <a href={shortUrl} target="_blank" rel="noopener noreferrer">
            {shortUrl}
          </a>
        </p>
      )}

      {/* All URLs Table */}
      <h2>All URLs</h2>

      {listLoading ? (
        <p>Loading URLs...</p>
      ) : allUrls.length === 0 ? (
        <p>No URLs found.</p>
      ) : (
        <table className="url-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Original URL</th>
              <th>Short URL</th>
              <th>Copy</th>
            </tr>
          </thead>
          <tbody>
            {allUrls.map((item) => (
              <tr key={item._id}>
                <td>{item.code}</td>
                <td>
                  <a href={item.originalUrl} target="_blank" rel="noopener noreferrer">
                    {item.originalUrl}
                  </a>
                </td>
                <td>
                  <a href={item.shortUrl} target="_blank" rel="noopener noreferrer">
                    {item.shortUrl}
                  </a>
                </td>
                <td>
                  <button className="copy-btn" onClick={() => handleCopy(item.shortUrl)}>
                    Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
