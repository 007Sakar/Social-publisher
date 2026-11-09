
import { useEffect, useState } from "react";
import {
  FileText,
  Trash2,
  CalendarDays,
  RefreshCw,
  Image,
  AlertCircle,
  Pencil,
  Save,
  X,
  Clock,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/";

const availablePlatforms = [
  { id: "youtube", name: "YouTube" },
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "tiktok", name: "TikTok" },
];

function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const [editingDraft, setEditingDraft] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [editPlatforms, setEditPlatforms] = useState([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const loadDrafts = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}scheduled/`);

      if (!response.ok) {
        throw new Error("Could not load drafts.");
      }

      const data = await response.json();
      const posts = Array.isArray(data) ? data : data.results || [];

      setDrafts(posts.filter((post) => post.status === "draft"));
    } catch (error) {
      console.error("Draft loading error:", error);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const openEditor = (draft) => {
    setEditingDraft(draft);
    setEditCaption(draft.caption || "");
    setEditPlatforms(draft.platforms || []);
    setScheduleDate("");
    setScheduleTime("");
    setNotice("");
  };

  const closeEditor = () => {
    setEditingDraft(null);
    setEditCaption("");
    setEditPlatforms([]);
    setScheduleDate("");
    setScheduleTime("");
  };

  const togglePlatform = (platform) => {
    setEditPlatforms((previous) =>
      previous.includes(platform)
        ? previous.filter((item) => item !== platform)
        : [...previous, platform]
    );
  };

  const saveDraft = async (shouldSchedule = false) => {
    if (!editingDraft) return;

    if (!editCaption.trim()) {
      setNotice("Please write a caption.");
      return;
    }

    if (editPlatforms.length === 0) {
      setNotice("Please select at least one platform.");
      return;
    }

    let scheduledAt = null;

    if (shouldSchedule) {
      if (!scheduleDate || !scheduleTime) {
        setNotice("Please select a date and time.");
        return;
      }

      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);

      if (
        isNaN(scheduledAt.getTime()) ||
        scheduledAt <= new Date()
      ) {
        setNotice("Please select a future date and time.");
        return;
      }
    }

    const updatedData = {
      caption: editCaption.trim(),
      platforms: editPlatforms,
      scheduled_at: scheduledAt
        ? scheduledAt.toISOString()
        : null,
      status: shouldSchedule ? "scheduled" : "draft",
    };

    try {
      setSaving(true);
      setNotice("");

      const response = await fetch(
        `${API_URL}scheduled/${editingDraft.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          JSON.stringify(data) ||
          "Could not update draft."
        );
      }

      if (shouldSchedule) {
        setDrafts((previous) =>
          previous.filter((draft) => draft.id !== editingDraft.id)
        );
        setNotice("Draft successfully moved to Scheduled!");
      } else {
        setDrafts((previous) =>
          previous.map((draft) =>
            draft.id === editingDraft.id
              ? { ...draft, ...data }
              : draft
          )
        );
        setNotice("Draft updated successfully!");
      }

      closeEditor();
    } catch (error) {
      console.error("Draft update error:", error);
      setNotice(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async (id) => {
    if (!window.confirm("Are you sure you want to delete this draft?")) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(`${API_URL}scheduled/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete this draft.");
      }

      setDrafts((previous) =>
        previous.filter((draft) => draft.id !== id)
      );

      setNotice("Draft deleted successfully!");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="drafts-page" style={{ marginTop: "30px" }}>

      <div className="section-heading">
        <div>
          <h2>Your saved drafts</h2>
          <p>Manage content that you have saved but not scheduled.</p>
        </div>

        <button
          className="secondary-button"
          onClick={loadDrafts}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="stats-grid" style={{ marginTop: "20px" }}>
        <div className="stat-card">
          <span>Total drafts</span>
          <h2>{drafts.length}</h2>
          <span className="stat-description">Saved content</span>
        </div>
      </div>

      {notice && (
        <div className="notice" style={{ marginTop: "20px" }}>
          <AlertCircle size={17} />
          <span>{notice}</span>
        </div>
      )}

      {editingDraft && (
        <div
          className="composer-card"
          style={{ marginTop: "20px", padding: "22px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <h3>Edit Draft #{editingDraft.id}</h3>

            <button
              className="secondary-button"
              onClick={closeEditor}
            >
              <X size={16} />
              Close
            </button>
          </div>

          <label style={{ display: "block", marginTop: "20px" }}>
            Caption
          </label>

          <textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "12px",
              borderRadius: "8px",
              resize: "vertical",
              background: "#171923",
              color: "white",
              border: "1px solid #383b4a",
              font: "inherit",
            }}
          />

          <label style={{ display: "block", marginTop: "20px" }}>
            Select platforms
          </label>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {availablePlatforms.map((platform) => (
              <label
                key={platform.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={editPlatforms.includes(platform.id)}
                  onChange={() => togglePlatform(platform.id)}
                />
                {platform.name}
              </label>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid #383b4a",
              marginTop: "24px",
              paddingTop: "20px",
            }}
          >
            <h4>
              <Clock size={16} style={{ verticalAlign: "middle" }} /> Schedule this draft
            </h4>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "14px",
              }}
            >
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                style={{ padding: "10px", borderRadius: "7px" }}
              />

              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                style={{ padding: "10px", borderRadius: "7px" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "22px",
            }}
          >
            <button
              className="secondary-button"
              onClick={() => saveDraft(false)}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              className="primary-button"
              onClick={() => saveDraft(true)}
              disabled={saving}
            >
              <CalendarDays size={16} />
              {saving ? "Saving..." : "Schedule Post"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div
          className="composer-card"
          style={{
            marginTop: "20px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          Loading drafts...
        </div>
      ) : drafts.length === 0 ? (
        <div
          className="composer-card"
          style={{
            marginTop: "20px",
            padding: "55px 20px",
            textAlign: "center",
          }}
        >
          <FileText size={42} />
          <h3>No drafts yet</h3>
          <p>Posts you save as drafts will appear here.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {drafts.map((draft) => (
            <article
              key={draft.id}
              className="composer-card"
              style={{ padding: "15px", minWidth: 0 }}
            >
              <div
                style={{
                  background: "#171923",
                  borderRadius: "10px",
                  aspectRatio: "4 / 3",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {draft.media_details?.file ? (
                  draft.media_details.media_type === "video" ? (
                    <video
                      src={draft.media_details.file}
                      controls
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <img
                      src={draft.media_details.file}
                      alt={draft.media_details.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )
                ) : (
                  <Image size={35} />
                )}
              </div>

              <div style={{ marginTop: "14px" }}>
                <strong>Draft #{draft.id}</strong>

                <p style={{ marginTop: "8px", wordBreak: "break-word" }}>
                  {draft.caption || "No caption"}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "7px",
                    marginTop: "12px",
                  }}
                >
                  {(draft.platforms || []).map((platform) => (
                    <span key={platform} className="local-badge">
                      {platform}
                    </span>
                  ))}
                </div>

                <p
                  style={{
                    fontSize: "12px",
                    opacity: 0.65,
                    marginTop: "12px",
                  }}
                >
                  Created: {new Date(draft.created_at).toLocaleDateString()}
                </p>

                <button
                  className="secondary-button"
                  onClick={() => openEditor(draft)}
                  style={{ width: "100%", marginTop: "12px" }}
                >
                  <Pencil size={15} />
                  Edit / Schedule
                </button>

                <button
                  className="secondary-button"
                  disabled={deletingId === draft.id}
                  onClick={() => deleteDraft(draft.id)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    color: "#ff6b6b",
                    borderColor: "#693c42",
                  }}
                >
                  <Trash2 size={15} />
                  {deletingId === draft.id ? "Deleting..." : "Delete draft"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default DraftsPage;
