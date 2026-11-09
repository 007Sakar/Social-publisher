import { apiFetch } from "./api";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock,
  Image,
  Video,
  X,
  Trash2,
  Edit3,
  RefreshCw
} from "lucide-react";

import "./CalendarPage.css";


const platformOptions = [
  { id: "youtube", name: "YouTube" },
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "tiktok", name: "TikTok" }
];

const pad = (number) => String(number).padStart(2, "0");

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatTime = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

const emptyForm = (date) => ({
  caption: "",
  media: "",
  platforms: [],
  date,
  time: "10:00"
});

function CalendarPage({ mediaItems = [] }) {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState(emptyForm(dateKey(today)));

  // LOAD POSTS FROM DJANGO
  const loadPosts = async () => {
    setLoading(true);

    try {
      const response = await apiFetch("scheduled/");

      if (!response.ok) {
        throw new Error("Could not load scheduled posts.");
      }

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Calendar loading error:", error);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // CALENDAR DAYS
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;

    const numberOfDays = new Date(year, month + 1, 0).getDate();

    const totalCells = Math.ceil((mondayOffset + numberOfDays) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - mondayOffset + 1;
      return new Date(year, month, dayNumber);
    });
  }, [currentMonth]);

  const postsByDate = useMemo(() => {
    const grouped = {};

    posts.forEach((post) => {
      if (!post.scheduled_at) return;

      const key = dateKey(new Date(post.scheduled_at));

      if (!grouped[key]) grouped[key] = [];

      grouped[key].push(post);
    });

    return grouped;
  }, [posts]);

  const selectedPosts = postsByDate[selectedDate] || [];

  // OPEN CREATE MODAL
  const openCreateModal = (date = selectedDate) => {
    setEditingPost(null);
    setForm(emptyForm(date));
    setNotice("");
    setModalOpen(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (post) => {
    const date = post.scheduled_at
      ? dateKey(new Date(post.scheduled_at))
      : selectedDate;

    const time = post.scheduled_at
      ? formatTime(post.scheduled_at)
      : "10:00";

    setEditingPost(post);

    setForm({
      caption: post.caption || "",
      media: post.media ? String(post.media) : "",
      platforms: post.platforms || [],
      date,
      time
    });

    setNotice("");
    setModalOpen(true);
  };

  // SELECT PLATFORMS
  const togglePlatform = (id) => {
    setForm((previous) => ({
      ...previous,
      platforms: previous.platforms.includes(id)
        ? previous.platforms.filter((item) => item !== id)
        : [...previous.platforms, id]
    }));
  };

  // SAVE POST
  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.date || !form.time) {
      setNotice("Please select a date and time.");
      return;
    }

    if (form.platforms.length === 0) {
      setNotice("Please select at least one platform.");
      return;
    }

    const scheduledDateTime = new Date(
      `${form.date}T${form.time}`
    );

    if (Number.isNaN(scheduledDateTime.getTime())) {
      setNotice("Please enter a valid date and time.");
      return;
    }

    if (scheduledDateTime <= new Date()) {
      setNotice("Please select a future date and time.");
      return;
    }

    const payload = {
      caption: form.caption,
      media: form.media ? Number(form.media) : null,
      platforms: form.platforms,
      scheduled_at: scheduledDateTime.toISOString(),
      status: "scheduled"
    };

    setSaving(true);
    setNotice("");

    try {
      const endpoint = editingPost
  ? `scheduled/${editingPost.id}/`
  : "scheduled/";

const response = await apiFetch(endpoint, {
  method: editingPost ? "PATCH" : "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          JSON.stringify(errorData) || "Could not save scheduled post."
        );
      }

      await loadPosts();

      setSelectedDate(form.date);
      setCurrentMonth(
        new Date(
          Number(form.date.slice(0, 4)),
          Number(form.date.slice(5, 7)) - 1,
          1
        )
      );

      setModalOpen(false);
      setEditingPost(null);
      setNotice("Scheduled post saved successfully!");
    } catch (error) {
      console.error("Save post error:", error);
      setNotice(error.message || "Could not save post.");
    } finally {
      setSaving(false);
    }
  };

  // DELETE POST
  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this scheduled post?")) return;

    setDeletingId(postId);

    try {
     const response = await apiFetch(
  `scheduled/${postId}/`,
  { method: "DELETE" }
);

      if (!response.ok) {
        throw new Error("Could not delete scheduled post.");
      }

      setPosts((previous) =>
        previous.filter((post) => post.id !== postId)
      );

      setNotice("Scheduled post deleted successfully!");
    } catch (error) {
      console.error("Delete post error:", error);
      setNotice(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const changeMonth = (amount) => {
    setCurrentMonth((previous) =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() + amount,
        1
      )
    );
  };

  const selectedMedia = mediaItems.find(
    (item) => String(item.id) === String(form.media)
  );

  return (
    <div className="calendar-page">

      <div className="calendar-header">
        <div>
          <div className="calendar-eyebrow">
            CONTENT PLANNER
          </div>
          <h2>Content Calendar</h2>
          <p>Plan and manage your upcoming social media posts.</p>
        </div>

        <button
          className="calendar-primary"
          onClick={() => openCreateModal()}
        >
          <Plus size={18} />
          Schedule post
        </button>
      </div>

      {notice && !modalOpen && (
        <div className="calendar-notice">
          {notice}
          <button onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="calendar-layout">

        <section className="calendar-main">

          <div className="calendar-toolbar">
            <div>
              <h3>
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric"
                })}
              </h3>
              <span>{posts.length} saved posts</span>
            </div>

            <div className="calendar-controls">
              <button
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft size={19} />
              </button>

              <button
                onClick={() => {
                  setCurrentMonth(
                    new Date(today.getFullYear(), today.getMonth(), 1)
                  );
                  setSelectedDate(dateKey(new Date()));
                }}
              >
                Today
              </button>

              <button
                onClick={() => changeMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          <div className="calendar-grid">

            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day) => (
                <div className="calendar-weekday" key={day}>
                  {day}
                </div>
              )
            )}

            {calendarDays.map((day, index) => {
              const key = dateKey(day);
              const dayPosts = postsByDate[key] || [];

              const isCurrentMonth =
                day.getMonth() === currentMonth.getMonth();

              const isToday = key === dateKey(new Date());
              const isSelected = key === selectedDate;

              return (
                <button
                  key={`${key}-${index}`}
                  className={`calendar-day ${
                    !isCurrentMonth ? "outside-month" : ""
                  } ${isToday ? "today" : ""} ${
                    isSelected ? "selected-day" : ""
                  }`}
                  onClick={() => setSelectedDate(key)}
                >
                  <span className="calendar-day-number">
                    {day.getDate()}
                  </span>

                  <div className="calendar-day-posts">
                    {dayPosts.slice(0, 2).map((post) => (
                      <span
                        key={post.id}
                        className={`calendar-post-dot ${post.status}`}
                        title={post.caption || "Untitled post"}
                      >
                        {post.caption || "Untitled post"}
                      </span>
                    ))}

                    {dayPosts.length > 2 && (
                      <small>+{dayPosts.length - 2} more</small>
                    )}
                  </div>
                </button>
              );
            })}

          </div>

          <div className="calendar-legend">
            <span><i className="legend-dot scheduled" /> Scheduled</span>
            <span><i className="legend-dot draft" /> Draft</span>
            <span><i className="legend-dot published" /> Published</span>
            <span><i className="legend-dot failed" /> Failed</span>
          </div>

        </section>

        <aside className="calendar-agenda">

          <div className="agenda-heading">
            <div>
              <span>DAILY AGENDA</span>
              <h3>
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "short",
                    day: "numeric"
                  }
                )}
              </h3>
            </div>

            <button
              onClick={() => openCreateModal(selectedDate)}
              title="Add post"
            >
              <Plus size={18} />
            </button>
          </div>

          {loading ? (
            <div className="agenda-empty">
              <RefreshCw size={22} />
              <p>Loading posts...</p>
            </div>
          ) : selectedPosts.length === 0 ? (
            <div className="agenda-empty">
              <CalendarDays size={32} />
              <strong>No posts for this day</strong>
              <p>Schedule something for this date.</p>
              <button
                className="calendar-primary"
                onClick={() => openCreateModal(selectedDate)}
              >
                <Plus size={16} />
                Add post
              </button>
            </div>
          ) : (
            <div className="agenda-list">
              {selectedPosts.map((post) => {
                const mediaItem = mediaItems.find(
                  (item) => item.id === post.media
                );

                return (
                  <article className="agenda-post" key={post.id}>
                    <div className="agenda-post-time">
                      <Clock size={14} />
                      {formatTime(post.scheduled_at)}
                    </div>

                    {mediaItem && (
                      <div className="agenda-media">
                        {mediaItem.media_type === "video" ? (
                          <Video size={18} />
                        ) : (
                          <Image size={18} />
                        )}
                        <span>{mediaItem.title}</span>
                      </div>
                    )}

                    <p>{post.caption || "No caption added."}</p>

                    <div className="agenda-platforms">
                      {(post.platforms || []).map((platform) => (
                        <span key={platform}>{platform}</span>
                      ))}
                    </div>

                    <div className="agenda-post-footer">
                      <span className={`post-status ${post.status}`}>
                        {post.status}
                      </span>

                      <div>
                        <button
                          onClick={() => openEditModal(post)}
                          title="Edit post"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          title="Delete post"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </aside>

      </div>

      {modalOpen && (
        <div
          className="calendar-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <form
            className="calendar-modal"
            onSubmit={handleSave}
          >
            <div className="calendar-modal-header">
              <div>
                <span>CONTENT PLANNER</span>
                <h2>
                  {editingPost ? "Edit scheduled post" : "Schedule a post"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <label className="calendar-field">
              Caption
              <textarea
                value={form.caption}
                onChange={(event) =>
                  setForm({ ...form, caption: event.target.value })
                }
                placeholder="Write your post caption..."
                rows={4}
              />
            </label>

            <label className="calendar-field">
              Select uploaded media
              <select
                value={form.media}
                onChange={(event) =>
                  setForm({ ...form, media: event.target.value })
                }
              >
                <option value="">No media attached</option>

                {mediaItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.media_type})
                  </option>
                ))}
              </select>
            </label>

            {selectedMedia && (
              <div className="calendar-selected-media">
                {selectedMedia.media_type === "video" ? (
                  <Video size={18} />
                ) : (
                  <Image size={18} />
                )}
                {selectedMedia.title}
              </div>
            )}

            <div className="calendar-field">
              Select platforms
              <div className="calendar-platform-options">
                {platformOptions.map((platform) => (
                  <button
                    type="button"
                    key={platform.id}
                    className={
                      form.platforms.includes(platform.id)
                        ? "platform-selected"
                        : ""
                    }
                    onClick={() => togglePlatform(platform.id)}
                  >
                    {platform.name}
                    {form.platforms.includes(platform.id) ? " ✓" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="calendar-date-fields">
              <label className="calendar-field">
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                  required
                />
              </label>

              <label className="calendar-field">
                Time
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) =>
                    setForm({ ...form, time: event.target.value })
                  }
                  required
                />
              </label>
            </div>

            {notice && (
              <div className="calendar-notice">
                {notice}
              </div>
            )}

            <div className="calendar-modal-actions">
              <button
                type="button"
                className="calendar-cancel"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="calendar-primary"
                disabled={saving}
              >
                <CalendarDays size={17} />
                {saving
                  ? "Saving..."
                  : editingPost
                    ? "Save changes"
                    : "Schedule post"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

export default CalendarPage;
