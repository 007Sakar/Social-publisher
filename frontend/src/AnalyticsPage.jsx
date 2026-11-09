import { apiFetch } from "./api";
import { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  CalendarCheck,
  CheckCircle2,
  FileEdit,
  RefreshCw,
  AlertCircle,
  Video,
  Camera,
  Users,
  Music2,
} from "lucide-react";

import "./AnalyticsPage.css";


const platforms = [
  { id: "youtube", name: "YouTube", icon: Video },
  { id: "instagram", name: "Instagram", icon: Camera },
  { id: "facebook", name: "Facebook", icon: Users },
  { id: "tiktok", name: "TikTok", icon: Music2 },
];

function AnalyticsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRange, setSelectedRange] = useState(30);

  // Fetch analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("scheduled/");

      if (!response.ok) {
        throw new Error("Could not load analytics data.");
      }

      const data = await response.json();

      const allPosts = Array.isArray(data)
        ? data
        : data.results || [];

      setPosts(allPosts);
    } catch (err) {
      console.error("Analytics loading error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Post statistics
  const totalPosts = posts.length;

  const scheduledPosts = posts.filter(
    (post) => post.status === "scheduled"
  ).length;

  const publishedPosts = posts.filter(
    (post) => post.status === "published"
  ).length;

  const draftPosts = posts.filter(
    (post) => post.status === "draft"
  ).length;

  const failedPosts = posts.filter(
    (post) => post.status === "failed"
  ).length;

  // Platform statistics
  const platformCounts = platforms.map((platform) => ({
    ...platform,
    count: posts.filter((post) =>
      (post.platforms || []).includes(platform.id)
    ).length,
  }));

  const maxPlatformCount = Math.max(
    1,
    ...platformCounts.map((platform) => platform.count)
  );

  // Activity chart for selected date range
  const activityDays = Array.from(
    { length: selectedRange },
    (_, index) => {
      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(
        date.getDate() - (selectedRange - 1 - index)
      );

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = posts.filter((post) => {
        if (!post.created_at) return false;

        const created = new Date(post.created_at);

        return created >= date && created < nextDate;
      }).length;

      let label = "";

      if (selectedRange === 7) {
        label = date.toLocaleDateString("en", {
          weekday: "short",
        });
      } else if (
        selectedRange === 30 &&
        (index % 5 === 0 || index === selectedRange - 1)
      ) {
        label = date.getDate();
      } else if (
        selectedRange === 90 &&
        (index % 7 === 0 || index === selectedRange - 1)
      ) {
        label = `${date.getDate()}/${date.getMonth() + 1}`;
      }

      return {
        key: date.toISOString(),
        label,
        count,
      };
    }
  );

  const maxDailyCount = Math.max(
    1,
    ...activityDays.map((day) => day.count)
  );

  // Summary cards
  const statCards = [
    {
      title: "Total Posts",
      value: totalPosts,
      description: "All created posts",
      icon: FileText,
    },
    {
      title: "Scheduled",
      value: scheduledPosts,
      description: "Upcoming posts",
      icon: CalendarCheck,
    },
    {
      title: "Published",
      value: publishedPosts,
      description: "Published posts",
      icon: CheckCircle2,
    },
    {
      title: "Drafts",
      value: draftPosts,
      description: "Saved drafts",
      icon: FileEdit,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <section className="analytics-page">
        <div className="analytics-loading">
          <RefreshCw size={25} className="analytics-spin" />
          <h3>Loading analytics...</h3>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="analytics-page">
        <div className="analytics-error">
          <AlertCircle size={28} />
          <h3>Unable to load analytics</h3>
          <p>{error}</p>

          <button
            className="primary-button"
            onClick={loadAnalytics}
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="analytics-page">

      {/* Page heading */}
      <div className="analytics-heading">
        <div>
          <h2>Analytics Overview</h2>
          <p>Track your content activity across platforms.</p>
        </div>

        <button
          className="secondary-button"
          onClick={loadAnalytics}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics cards */}
      <div className="analytics-stats-grid">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className="analytics-stat-card"
              key={stat.title}
            >
              <div className="analytics-stat-top">
                <span>{stat.title}</span>
                <Icon size={21} />
              </div>

              <h2>{stat.value}</h2>
              <p>{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="analytics-charts-grid">

        {/* Content activity */}
        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Content Activity</h3>
              <p>
                Posts created during the last {selectedRange} days
              </p>
            </div>

            <div className="analytics-range-selector">
              {[7, 30, 90].map((range) => (
                <button
                  key={range}
                  className={
                    selectedRange === range ? "active" : ""
                  }
                  onClick={() => setSelectedRange(range)}
                >
                  {range}D
                </button>
              ))}
            </div>
          </div>

          <div
            className={`analytics-bar-chart range-${selectedRange}`}
          >
            {activityDays.map((day) => (
              <div
                className="analytics-bar-column"
                key={day.key}
              >
                <span className="analytics-bar-value">
                  {day.count > 0 ? day.count : ""}
                </span>

                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar"
                    style={{
                      height: `${(day.count / maxDailyCount) * 100}%`,
                    }}
                  />
                </div>

                <span className="analytics-bar-label">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform distribution */}
        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Platform Distribution</h3>
              <p>Posts assigned to each platform</p>
            </div>

            <BarChart3 size={21} />
          </div>

          <div className="analytics-platform-list">
            {platformCounts.map((platform) => {
              const Icon = platform.icon;

              const percentage = totalPosts
                ? Math.round((platform.count / totalPosts) * 100)
                : 0;

              return (
                <div
                  className="analytics-platform-item"
                  key={platform.id}
                >
                  <div className="analytics-platform-info">
                    <span>
                      <Icon size={17} />
                      {platform.name}
                    </span>

                    <strong>{platform.count}</strong>
                  </div>

                  <div className="analytics-progress-track">
                    <div
                      className="analytics-progress-bar"
                      style={{
                        width: `${(platform.count / maxPlatformCount) * 100}%`,
                      }}
                    />
                  </div>

                  <small>
                    {percentage}% of total posts
                  </small>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Post status overview */}
      <div className="analytics-panel analytics-status-panel">
        <div className="analytics-panel-heading">
          <div>
            <h3>Post Status Overview</h3>
            <p>Current status of your content</p>
          </div>
        </div>

        <div className="analytics-status-list">
          <div>
            <span>Drafts</span>
            <strong>{draftPosts}</strong>
          </div>

          <div>
            <span>Scheduled</span>
            <strong>{scheduledPosts}</strong>
          </div>

          <div>
            <span>Published</span>
            <strong>{publishedPosts}</strong>
          </div>

          <div>
            <span>Failed</span>
            <strong>{failedPosts}</strong>
          </div>
        </div>
      </div>

      {/* Information note */}
      <div className="analytics-note">
        <AlertCircle size={18} />

        <p>
          These statistics represent your SocialFlow database activity.
          Views, likes, reach, comments, and engagement metrics will
          become available after social media API integration.
        </p>
      </div>

    </section>
  );
}

export default AnalyticsPage;
