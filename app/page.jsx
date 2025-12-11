"use client";
import { useState } from "react";

const recommendManga = "https://api.jikan.moe/v4/recommendations/manga";
const topManga = "https://api.jikan.moe/v4/top/manga";
const popularManga = "https://api.jikan.moe/v4/top/manga?filter=bypopularity";

export default function Home() {
  const [mangaName, setMangaName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Transform Jikan API data to our model format
  function transformMangaData(mangaItem) {
    // Handle both recommendation format and regular manga format
    const manga = mangaItem.manga || mangaItem;
    
    // Extract genres - handle both array of objects and array of strings
    let genres = [];
    if (manga.genres && Array.isArray(manga.genres)) {
      genres = manga.genres.map(g => (typeof g === 'string' ? g : (g.name || g)));
    }
    
    return {
      mangaName: manga.title || manga.name || "",
      mangaPoster: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || manga.image_url || "",
      mangaId: String(manga.mal_id || manga.id || ""),
      genres: genres.length > 0 ? genres : [],
      status: manga.status || "Unknown"
    };
  }

  // Store a single manga using the API route
  async function storeManga(mangaData) {
    try {
      const response = await fetch("/api/store-manga", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mangaData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to store manga");
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Helper function to create a delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Store multiple manga items
  async function storeMultipleManga(mangaItems) {
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < mangaItems.length; i++) {
      const item = mangaItems[i];
      const transformed = transformMangaData(item);
      
      // Skip if required fields are missing
      if (!transformed.mangaName || !transformed.mangaId || !transformed.mangaPoster) {
        errorCount++;
        continue;
      }

      const result = await storeManga(transformed);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        // Only log non-duplicate errors
        if (!result.error.includes("already exists")) {
          errors.push(`${transformed.mangaName}: ${result.error}`);
        }
      }

      // Add 1000ms delay between each storage, except after the last item
      if (i < mangaItems.length - 1) {
        await delay(1000);
      }
    }

    return { successCount, errorCount, errors };
  }

  async function getRecommendedManga() {
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch(recommendManga);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Flatten recommendation entries (each recommendation has an "entry" array)
        const mangaItems = data.data.flatMap(rec => rec.entry || []);
        const result = await storeMultipleManga(mangaItems);
        
        setMessage({
          type: "success",
          text: `Stored ${result.successCount} recommended manga. ${result.errorCount} failed.`
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function getTopManga() {
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch(topManga);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        const result = await storeMultipleManga(data.data);
        
        setMessage({
          type: "success",
          text: `Stored ${result.successCount} top manga. ${result.errorCount} failed.`
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function getPopularManga() {
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch(popularManga);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        const result = await storeMultipleManga(data.data);
        
        setMessage({
          type: "success",
          text: `Stored ${result.successCount} popular manga. ${result.errorCount} failed.`
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function getSearchedManga(mangaName) {
    if (!mangaName.trim()) {
      setMessage({ type: "error", text: "Please enter a manga name" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const apiUrl = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(mangaName)}&order_by=popularity&sort=asc&sfw&limit=1`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const result = await storeManga(transformMangaData(data.data[0]));
        
        if (result.success) {
          setMessage({ type: "success", text: `Successfully stored: ${data.data[0].title}` });
          setMangaName("");
        } else {
          setMessage({ type: "error", text: result.error });
        }
      } else {
        setMessage({ type: "error", text: "No manga found with that name" });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    getSearchedManga(mangaName);
  };

  return (
    <div className=" text-white flex flex-col items-center gap-5">
      <h1 className=" text-4xl font-bold mt-10">Manga DB management</h1>

      {message.text && (
        <div className={`px-4 py-2 rounded ${
          message.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {message.text}
        </div>
      )}

      <div className=" flex flex-wrap text-xl justify-center gap-4">
        <button
          onClick={getRecommendedManga}
          disabled={loading}
          className=" border border-white rounded-full p-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:text-black transition"
        >
          {loading ? "Loading..." : "Store recommended manga"}
        </button>
        <button
          onClick={getTopManga}
          disabled={loading}
          className=" border border-white rounded-full p-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:text-black transition"
        >
          {loading ? "Loading..." : "Store top manga"}
        </button>
        <button
          onClick={getPopularManga}
          disabled={loading}
          className=" border border-white rounded-full p-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:text-black transition"
        >
          {loading ? "Loading..." : "Store popular manga"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className=" text-white flex flex-row">
        <input
          className=" rounded-tl-sm text-white rounded-bl-sm outline-0 border border-white text-xl p-1"
          placeholder="Enter the manga name to store..."
          type="text"
          value={mangaName}
          onChange={(e) => setMangaName(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className=" rounded-tr-sm rounded-br-sm border border-white bg-white font-bold px-2 text-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
