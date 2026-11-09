
import { useEffect, useState } from "react";
import {
  Send,
  Image as ImageIcon,
  Video,
  RefreshCw,
  CalendarDays,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

import "./PublishedPage.css";

const API_URL = "http://127.0.0.1:8000/api/";

const platformNames = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok"
};

function PublishedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}scheduled/`);

      if (!response.ok) {
        throw new Error("Could not load published posts.");
      }

      const data = await response.json();

      const allPosts = Array.isArray(data)
        ? data
        : data.results || [];

      setPosts(
        allPosts.filter((post) => post.status === "published")
      );

    } catch (err) {
      console.error("Published posts error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <section className="published-page">

      <div className="published-heading">
        <div>
          <h2>Published content</h2>
          <p>View all posts marked as successfully published.</p>
        </div>

        <button
          className="secondary-button"
          onClick={loadPosts}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="published-summary">
        <div className="published-summary-icon">
          <CheckCircle2 size={23} />
        </div>

        <div>
          <strong>{posts.length} published posts</strong>
          <span>Your published content history.</span>
        </div>
      </div>

      {loading ? (

        <div className="published-empty">
          <RefreshCw size={28} className="published-loading-icon" />
          <h3>Loading published posts...</h3>
        </div>

      ) : error ? (

        <div className="published-empty">
          <AlertCircle size={32} />
          <h3>Unable to load posts</h3>
          <p>{error}</p>

          <button className="primary-button" onClick={loadPosts}>
            Try again
          </button>
        </div>

      ) : posts.length === 0 ? (

        <div className="published-empty">
          <div className="published-empty-icon">
            <Send size={30} />
          </div>

          <h3>No published posts yet</h3>

          <p>
            Posts marked as published will appear here.
          </p>
        </div>

      ) : (

        <div className="published-grid">

          {posts.map((post) => (

            <article className="published-card" key={post.id}>

              <div className="published-media">

                {post.media_details?.file ? (

  post.media_details.media_type === "video" ? (
    <video
      src={post.media_details.file}
      controls
      preload="metadata"
    />
  ) : (
    <img
      src={post.media_details.file}
      alt={post.media_details.title}
    />
  )

) : (
  <div className="published-no-media">
    <ImageIcon size={30} />
    <span>No media attached</span>
  </div>
)}

              </div>

              <div className="published-card-content">

                <div className="published-status">
                  <CheckCircle2 size={14} />
                  Published
                </div>

                <p className="published-caption">
                  {post.caption || "No caption"}
                </p>

                <div className="published-platforms">
                  {(post.platforms || []).map((platform) => (
                    <span key={platform}>
                      {platformNames[platform] || platform}
                    </span>
                  ))}
                </div>

                <div className="published-date">
                  <CalendarDays size={15} />
                  {post.scheduled_at
                    ? new Date(post.scheduled_at).toLocaleString()
                    : "Date unavailable"}
                </div>

              </div>

            </article>

          ))}

        </div>

      )}

    </section>
  );
}

export default PublishedPage;
