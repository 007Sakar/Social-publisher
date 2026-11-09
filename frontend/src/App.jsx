
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,CalendarDays, Send, Image, Settings, Plus, Users, Music2,
   UploadCloud, PlayCircle,Camera, Clock3, CheckCircle2,AlertCircle,X,FileVideo2,
   Sparkles, BarChart3, Link2, Hash, Eye, MoreHorizontal, Search,Bell,ChevronDown
} from "lucide-react";

import "./App.css";
import CalendarPage from "./CalendarPage";
import PublishedPage from "./PublishedPage";

const API_URL = "http://127.0.0.1:8000/api/";

const platforms = [
  {
    id: "youtube",
    name: "YouTube",
    icon: PlayCircle,
    color: "#ff4545"
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Camera,
    color: "#e85b9b"
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Users,
    color: "#4388ed"
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music2,
    color: "#eeeeee"
  }
];

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Create Post", icon: Plus },
  { name: "Scheduled", icon: CalendarDays },
  { name: "Published", icon: Send },
  { name: "Media Library", icon: Image },
  { name: "Analytics", icon: BarChart3 },
  { name: "Settings", icon: Settings }
];

function App() {
  const [activePage, setActivePage] = useState("Overview");

  const [postStats, setPostStats] = useState({
    total: 0,
    scheduled: 0,
    published: 0,
  });


  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  const [file, setFile] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [caption, setCaption] = useState("");

  const [publishingMode, setPublishingMode] = useState("now");

  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const [notice, setNotice] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");

  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);

  // LOAD MEDIA FROM DJANGO BACKEND
  useEffect(() => {
    const loadMedia = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Could not load media.");
        }

        const data = await response.json();

        setMediaItems(data);
      } catch (error) {
        console.error("Media loading error:", error);
      }
    };

    loadMedia();
  }, []);


  // LOAD POST STATISTICS FROM DJANGO BACKEND
  useEffect(() => {
    const loadPostStats = async () => {
      try {
        const response = await fetch(`${API_URL}scheduled/`);

        if (!response.ok) {
          throw new Error("Could not load post statistics.");
        }

        const data = await response.json();

        const posts = Array.isArray(data)
          ? data
          : data.results || [];

        setPostStats({
          total: posts.length,
          scheduled: posts.filter(
            (post) => post.status === "scheduled"
          ).length,
          published: posts.filter(
            (post) => post.status === "published"
          ).length,
        });

      } catch (error) {
        console.error("Post statistics error:", error);
      }
    };

    loadPostStats();
  }, [activePage]);


  // CREATE LOCAL FILE PREVIEW
  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);

    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // SELECT OR DESELECT PLATFORMS
  const togglePlatform = (id) => {
    setSelectedPlatforms((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  // UPLOAD FILE TO DJANGO BACKEND
  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    console.log("Upload function triggered:", selectedFile.name);

    // Validate file type
    if (
      !selectedFile.type.startsWith("video/") &&
      !selectedFile.type.startsWith("image/")
    ) {
      setNotice("Please select a valid image or video file.");
      return;
    }

    // Validate file size (500 MB maximum)
    if (selectedFile.size > 500 * 1024 * 1024) {
      setNotice("File size cannot exceed 500 MB.");
      return;
    }

    // Display local preview immediately
    setFile(selectedFile);

    setUploadedMedia(null);

    setUploading(true);

    setNotice("Uploading your media...");

    try {
      const formData = new FormData();

      formData.append("title", selectedFile.name);

      formData.append("file", selectedFile);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.file?.[0] ||
          errorData.title?.[0] ||
          errorData.detail ||
          "Upload failed."
        );
      }

      const uploaded = await response.json();

      console.log("Upload successful:", uploaded);

      setUploadedMedia(uploaded);

      // Update media library
      setMediaItems((previous) => [
        uploaded,
        ...previous.filter((item) => item.id !== uploaded.id)
      ]);

      setNotice("Media uploaded successfully!");

    } catch (error) {
      console.error("Upload error:", error);

      setNotice(error.message || "Upload failed.");

    } finally {
      setUploading(false);
    }
  };

  // HANDLE DRAG AND DROP
  const handleDrop = (event) => {
    event.preventDefault();

    setDragging(false);

    handleFile(event.dataTransfer.files[0]);
  };

  // PREPARE POST
const handleSubmit = async () => {
  if (!uploadedMedia) {
    setNotice("Please upload your media successfully first.");
    return;
  }

  if (selectedPlatforms.length === 0) {
    setNotice("Please select at least one platform.");
    return;
  }

  if (!caption.trim()) {
    setNotice("Please write a caption.");
    return;
  }

  let scheduledAt = null;

  if (publishingMode === "schedule") {
    if (!scheduledDate || !scheduledTime) {
      setNotice("Please select a scheduled date and time.");
      return;
    }

    scheduledAt = new Date(
      `${scheduledDate}T${scheduledTime}`
    );

    if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      setNotice("Please select a future date and time.");
      return;
    }
  }

  const postStatus =
    publishingMode === "schedule" ? "scheduled" : "draft";

  const postData = {
    caption: caption.trim(),
    media: uploadedMedia.id,
    platforms: selectedPlatforms,
    scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
    status: postStatus,
  };

  try {
    setSavingPost(true);
    setNotice("");

    const response = await fetch(`${API_URL}scheduled/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        JSON.stringify(data) ||
        "Could not save your post."
      );
    }

    setPostStats((previous) => ({
      ...previous,
      total: previous.total + 1,
      scheduled:
        previous.scheduled + (postStatus === "scheduled" ? 1 : 0),
    }));

    clearComposer();

    setNotice(
      postStatus === "scheduled"
        ? "Your post has been scheduled successfully!"
        : "Your post has been saved as a draft!"
    );

  } catch (error) {
    console.error("Post saving error:", error);
    setNotice(error.message || "Something went wrong while saving.");
  } finally {
    setSavingPost(false);
  }
};

  // DELETE MEDIA FROM DJANGO BACKEND
  const handleDeleteMedia = async (mediaId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this media file?"
    );

    if (!confirmed) return;

    setDeletingId(mediaId);

    try {
      const response = await fetch(`${API_URL}${mediaId}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete this media file.");
      }

      setMediaItems((previous) =>
        previous.filter((item) => item.id !== mediaId)
      );

      if (uploadedMedia?.id === mediaId) {
        setUploadedMedia(null);
        setFile(null);
      }

      setNotice("Media deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      setNotice(error.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  // CLEAR COMPOSER
  const clearComposer = () => {
    setFile(null);

    setUploadedMedia(null);

    setCaption("");

    setSelectedPlatforms([]);

    setScheduledDate("");

    setScheduledTime("");

    setPublishingMode("now");

    setNotice("Composer cleared.");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isVideo = file?.type.startsWith("video/");

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Send size={21} />
          </div>

          <div>
            <h2>SocialFlow</h2>
            <span>Publishing Studio</span>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-avatar">S</div>

          <div className="workspace-info">
            <strong>My Workspace</strong>
            <span>Personal account</span>
          </div>

          <ChevronDown size={16} />
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setNotice("");
                }}
              >
                <Icon size={19} />

                <span>{item.name}</span>

                {item.name === "Scheduled" && (
  <span className="nav-count">{postStats.scheduled}</span>
)}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">

          <div className="upgrade-card">
            <Sparkles size={19} />

            <strong>SocialFlow Pro</strong>

            <p>Your personal publishing workspace.</p>

            <span className="local-badge">
              LOCAL DEVELOPMENT
            </span>
          </div>

          <div className="profile">
            <div className="profile-avatar">S</div>

            <div className="profile-info">
              <strong>Sakar</strong>
              <span>Administrator</span>
            </div>

            <MoreHorizontal size={20} />
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOP BAR */}
        <header className="topbar">

          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="top-actions">

            <button className="icon-button">
              <Search size={19} />
            </button>

            <button className="icon-button notification">
              <Bell size={19} />
              <i />
            </button>

            <div className="top-avatar">S</div>

          </div>

        </header>

        <div className="page-container">

          {/* WELCOME SECTION */}
          <div className="welcome-row">

            <div>
              <div className="eyebrow">
                YOUR SOCIAL MEDIA COMMAND CENTER
              </div>

              <h1>
                {activePage === "Overview"
                  ? "Good to see you, Sakar!"
                  : activePage}
              </h1>

              <p>
                {activePage === "Overview"
                  ? "Manage your content and publishing from one place."
                  : "Your centralized social media management workspace."}
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => setActivePage("Create Post")}
            >
              <Plus size={18} />
              Create post
            </button>

          </div>

          {/* STATISTICS */}
          <div className="stats-grid">

            <div className="stat-card">
              <div className="stat-top">
                <span>Total posts</span>

                <div className="stat-icon purple">
                  <Send size={19} />
                </div>
              </div>

              <h2>{postStats.total}</h2>

<span className="stat-description">
  Total posts in your workspace
</span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Scheduled posts</span>

                <div className="stat-icon blue">
                  <Clock3 size={19} />
                </div>
              </div>

              <h2>{postStats.scheduled}</h2>

<span className="stat-description">
  Upcoming content
</span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Published</span>

                <div className="stat-icon green">
                  <CheckCircle2 size={19} />
                </div>
              </div>

             <h2>{postStats.published}</h2>

<span className="stat-description">
  Successfully published
</span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Connected accounts</span>

                <div className="stat-icon orange">
                  <Link2 size={19} />
                </div>
              </div>

              <h2>
                0<span className="stat-total"> / 4</span>
              </h2>

              <span className="stat-description">
                Accounts connected
              </span>
            </div>

          </div>

         {activePage === "Scheduled" ? (
  <CalendarPage mediaItems={mediaItems} />
) : activePage === "Published" ? (
  <PublishedPage />
) : activePage === "Media Library" ? (
            <section style={{ marginTop: "30px" }}>
              <div className="section-heading">
                <div>
                  <h2>Your media library</h2>
                  <p>All images and videos uploaded to your workspace.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setActivePage("Create Post")}
                >
                  <Plus size={18} />
                  Upload media
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "15px",
                  margin: "25px 0",
                }}
              >
                <div className="stat-card">
                  <span>Total media files</span>
                  <h2>{mediaItems.length}</h2>
                </div>

                <div className="stat-card">
                  <span>Images</span>
                  <h2>
                    {mediaItems.filter((item) => item.media_type === "image").length}
                  </h2>
                </div>

                <div className="stat-card">
                  <span>Videos</span>
                  <h2>
                    {mediaItems.filter((item) => item.media_type === "video").length}
                  </h2>
                </div>
              </div>

              {notice && (
                <div className="notice" style={{ marginBottom: "18px" }}>
                  <AlertCircle size={17} />
                  <span>{notice}</span>
                </div>
              )}

              {mediaItems.length === 0 ? (
                <div
                  className="composer-card"
                  style={{ textAlign: "center", padding: "55px 20px" }}
                >
                  <Image size={42} />
                  <h3>Your media library is empty</h3>
                  <p>Upload your first image or video to get started.</p>
                  <button
                    className="primary-button"
                    style={{ marginTop: "15px" }}
                    onClick={() => setActivePage("Create Post")}
                  >
                    <Plus size={17} />
                    Upload your first file
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {mediaItems.map((item) => (
                    <article
                      key={item.id}
                      className="composer-card"
                      style={{ padding: "12px", minWidth: 0 }}
                    >
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "4 / 3",
                          overflow: "hidden",
                          borderRadius: "10px",
                          background: "#171923",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {item.media_type === "video" ? (
                          <video
                            src={item.file}
                            controls
                            preload="metadata"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <img
                            src={item.file}
                            alt={item.title}
                            loading="lazy"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>

                      <div style={{ padding: "12px 3px 3px" }}>
                        <strong
                          title={item.title}
                          style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: "8px",
                          }}
                        >
                          {item.title}
                        </strong>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                            fontSize: "12px",
                            opacity: 0.7,
                          }}
                        >
                          <span>
                            {item.media_type === "video" ? "Video" : "Image"}
                          </span>
                          <span>
                            {(item.file_size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>

                        <p style={{ fontSize: "12px", opacity: 0.65, marginTop: "8px" }}>
                          Uploaded: {new Date(item.uploaded_at).toLocaleDateString()}
                        </p>

                        <button
                          className="secondary-button"
                          disabled={deletingId === item.id}
                          style={{
                            width: "100%",
                            marginTop: "8px",
                            color: "#ff6b6b",
                            borderColor: "#693c42",
                          }}
                          onClick={() => handleDeleteMedia(item.id)}
                        >
                          {deletingId === item.id ? (
                            "Deleting..."
                          ) : (
                            <>
                              <X size={15} />
                              Delete media
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
          {/* COMPOSER SECTION */}
          <div className="section-heading">

            <div>
              <h2>Create your content</h2>

              <p>
                Upload once and prepare your post for multiple platforms.
              </p>
            </div>

            <span className="draft-label">NEW POST</span>

          </div>

          <div className="composer-grid">

            {/* LEFT COLUMN */}
            <section className="composer-card">

              {/* MEDIA UPLOAD */}
              <div className="card-heading">

                <div>
                  <h3>
                    <Image size={18} />
                    Media upload
                  </h3>

                  <p>
                    Upload a video or image from your computer.
                  </p>
                </div>

                {file && (
                  <button
                    className="remove-file"
                    onClick={() => {
                      setFile(null);
                      setUploadedMedia(null);
                      setNotice("");

                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X size={17} />
                  </button>
                )}

              </div>

              {/* UPLOAD AREA */}
              <div
                className={`upload-area ${
                  dragging ? "dragging" : ""
                } ${file ? "has-file" : ""}`}

                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}

                onDragLeave={() => setDragging(false)}

                onDrop={handleDrop}

                onClick={() => fileInputRef.current?.click()}
              >

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  hidden

                  onClick={(event) => event.stopPropagation()}

                  onChange={(event) => {
                    const selectedFile = event.target.files[0];

                    console.log("File selected:", selectedFile);

                    handleFile(selectedFile);
                  }}
                />

               {file && previewUrl ? (

                  <div className="file-preview">

                    {isVideo ? (
                      <video
                        src={previewUrl}
                        controls
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                      />
                    )}

                    <div className="file-details">

                      <strong>{file.name}</strong>

                      <span>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>

                    </div>

                    <span className="file-ready">

                      {uploading ? (
                        "Uploading..."
                      ) : uploadedMedia ? (
                        <>
                          <CheckCircle2 size={15} />
                          Uploaded
                        </>
                      ) : (
                        "Selected"
                      )}

                    </span>

                  </div>

                ) : (

                  <>
                    <div className="upload-icon">
                      <UploadCloud size={30} />
                    </div>

                    <h4>Drop your content here</h4>

                    <p>
                      or <span>browse files</span> from your computer
                    </p>

                    <div className="upload-formats">
                      <span>MP4</span>
                      <span>MOV</span>
                      <span>PNG</span>
                      <span>JPG</span>
                    </div>

                    <small>
                      Images and videos supported
                    </small>
                  </>

                )}

              </div>

              <div className="card-divider" />

              {/* PLATFORM SELECTION */}
              <div className="card-heading platform-heading">

                <div>
                  <h3>
                    <Send size={18} />
                    Select platforms
                  </h3>

                  <p>
                    Choose where you want your content to appear.
                  </p>
                </div>

                <span className="selected-count">
                  {selectedPlatforms.length} selected
                </span>

              </div>

              <div className="platform-grid">

                {platforms.map((platform) => {
                  const Icon = platform.icon;

                  const selected = selectedPlatforms.includes(
                    platform.id
                  );

                  return (
                    <button
                      key={platform.id}
                      className={`platform-option ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => togglePlatform(platform.id)}
                    >

                      <Icon
                        size={23}
                        style={{ color: platform.color }}
                      />

                      <span>{platform.name}</span>

                      <div className="platform-checkbox">
                        {selected && (
                          <CheckCircle2 size={15} />
                        )}
                      </div>

                    </button>
                  );
                })}

              </div>

              <div className="card-divider" />

              {/* CAPTION */}
              <div className="card-heading">

                <div>
                  <h3>
                    <Hash size={18} />
                    Caption and description
                  </h3>

                  <p>
                    Write something engaging for your audience.
                  </p>
                </div>

              </div>

              <textarea
                className="caption-input"
                placeholder="Write your caption here... Add hashtags to increase discoverability."
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={2200}
              />

              <div className="caption-footer">

                <span>
                  <Sparkles size={14} />
                  AI caption generation coming soon
                </span>

                <span>{caption.length}/2200</span>

              </div>

              <div className="card-divider" />

              {/* PUBLISHING OPTIONS */}
              <div className="card-heading">

                <div>
                  <h3>
                    <CalendarDays size={18} />
                    Publishing options
                  </h3>

                  <p>
                    Choose when your content should be published.
                  </p>
                </div>

              </div>

              <div className="publishing-options">

                <button
                  className={`publishing-option ${
                    publishingMode === "now" ? "selected" : ""
                  }`}
                  onClick={() => setPublishingMode("now")}
                >

                  <Send size={19} />

                  <span>
                    <strong>Publish now</strong>
                    <small>Post as soon as possible</small>
                  </span>

                  <div className="radio-dot" />

                </button>

                <button
                  className={`publishing-option ${
                    publishingMode === "schedule" ? "selected" : ""
                  }`}
                  onClick={() => setPublishingMode("schedule")}
                >

                  <Clock3 size={19} />

                  <span>
                    <strong>Schedule</strong>
                    <small>Choose a future date and time</small>
                  </span>

                  <div className="radio-dot" />

                </button>

              </div>

              {/* SCHEDULING FIELDS */}
              {publishingMode === "schedule" && (

                <div className="schedule-fields">

                  <label>
                    Date

                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(event) =>
                        setScheduledDate(event.target.value)
                      }
                      min={new Date().toLocaleDateString("en-CA")}
                    />
                  </label>

                  <label>
                    Time

                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(event) =>
                        setScheduledTime(event.target.value)
                      }
                    />
                  </label>

                </div>

              )}

              {/* STATUS NOTICE */}
              {notice && (

                <div className="notice">
                  <AlertCircle size={17} />
                  <span>{notice}</span>
                </div>

              )}

              {/* ACTION BUTTONS */}
              <div className="submit-row">

                <button
                  className="secondary-button"
                  onClick={clearComposer}
                >
                  Clear
                </button>

                <button
                  className="primary-button publish-button"
                  onClick={handleSubmit}
                  disabled={uploading}
                >

                  {publishingMode === "now" ? (
                    <Send size={17} />
                  ) : (
                    <CalendarDays size={17} />
                  )}

                  {publishingMode === "now"
                    ? "Prepare post"
                    : "Prepare schedule"}

                </button>

              </div>

              <p className="integration-warning">
                <AlertCircle size={15} />
                Social accounts are not connected yet. Preparing a post does not publish it.
              </p>

            </section>

            {/* RIGHT COLUMN */}
            <aside className="right-column">

              {/* CONNECTED ACCOUNTS */}
              <div className="side-card">

                <div className="side-card-heading">

                  <div>
                    <h3>Connected accounts</h3>
                    <p>Manage your social platforms.</p>
                  </div>

                  <button className="small-icon-button">
                    <Plus size={18} />
                  </button>

                </div>

                <div className="connected-list">

                  {platforms.map((platform) => {
                    const Icon = platform.icon;

                    return (
                      <div
                        className="connected-account"
                        key={platform.id}
                      >

                        <div className="account-icon">
                          <Icon
                            size={21}
                            style={{ color: platform.color }}
                          />
                        </div>

                        <div className="account-info">
                          <strong>{platform.name}</strong>
                          <span>Not connected</span>
                        </div>

                        <span className="disconnected-dot" />

                      </div>
                    );
                  })}

                </div>

                <button
                  className="connect-all-button"
                  onClick={() =>
                    setNotice(
                      "Social account connections will be implemented in the API integration stage."
                    )
                  }
                >
                  <Link2 size={16} />
                  Connect accounts
                </button>

              </div>

              {/* POST PREVIEW */}
              <div className="side-card preview-card">

                <div className="side-card-heading">

                  <div>
                    <h3>Post preview</h3>
                    <p>Preview your uploaded content.</p>
                  </div>

                  <Eye size={18} />

                </div>

                <div className="preview-window">

                  {file && previewUrl ? (

                    isVideo ? (
                      <video
                        src={previewUrl}
                        controls
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Post preview"
                      />
                    )

                  ) : (

                    <div className="empty-preview">

                      <div className="preview-placeholder-icon">
                        <FileVideo2 size={30} />
                      </div>

                      <strong>
                        Your content will appear here
                      </strong>

                      <span>
                        Upload an image or video to see a preview.
                      </span>

                    </div>

                  )}

                </div>

                <div className="preview-caption">

                  <div className="preview-user-avatar">S</div>

                  <div>
                    <strong>My Social Account</strong>

                    <p>
                      {caption || "Your caption will appear here..."}
                    </p>
                  </div>

                </div>

                <div className="preview-platforms">

                  {selectedPlatforms.length > 0 ? (

                    selectedPlatforms.map((id) => {
                      const platform = platforms.find(
                        (item) => item.id === id
                      );

                      const Icon = platform.icon;

                      return (
                        <span key={id}>
                          <Icon size={15} />
                          {platform.name}
                        </span>
                      );
                    })

                  ) : (

                    <span>
                      Select platforms to see them here.
                    </span>

                  )}

                </div>

              </div>

              {/* TIP CARD */}
              <div className="tip-card">

                <div className="tip-icon">
                  <Sparkles size={20} />
                </div>

                <strong>Coming next: AI tools</strong>

                <p>
                  Generate captions, hashtags and platform-specific descriptions automatically.
                </p>

              </div>

            </aside>

          </div>

            </>
          )}

          {/* FOOTER */}
          <footer className="footer">

            <span>SocialFlow © 2026</span>

            <span>
              Personal publishing workspace · Local development
            </span>

          </footer>

        </div>

      </main>

    </div>
  );
}

export default App;
