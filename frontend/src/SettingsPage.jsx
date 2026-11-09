
import { useEffect, useState } from "react";
import {
  User,
  Palette,
  Bell,
  Shield,
  Save,
  Moon,
  Sun,
  Monitor,
  Mail,
  Lock,
  CheckCircle2,
} from "lucide-react";

import { apiFetch } from "./api";
import "./SettingsPage.css";

function SettingsPage({ appearance, setAppearance }) {
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    name: "SocialFlow User",
    username: "",
    email: "",
    bio: "",
  });

  const [notifications, setNotifications] = useState({
    scheduled: true,
    published: true,
    failed: true,
    reminders: true,
  });

  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // LOAD SETTINGS FROM DJANGO
  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        setLoading(true);

        const response = await apiFetch("settings/");

        if (!response.ok) {
          throw new Error("Could not load your settings.");
        }

        const data = await response.json();

        if (!active) return;

        setProfile({
          name: data.display_name || "SocialFlow User",
          username: data.username || "",
          email: data.email || "",
          bio: data.bio || "",
        });

        setNotifications({
          scheduled: true,
          published: true,
          failed: true,
          reminders: true,
          ...(data.notifications || {}),
        });

        if (data.appearance) {
          setAppearance(data.appearance);
        }
      } catch (error) {
        if (active) {
          setNotice(error.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, [setAppearance]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account", label: "Account", icon: Shield },
  ];

  const updateProfile = (field, value) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleNotification = (field) => {
    setNotifications((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  // SAVE SETTINGS TO DJANGO
  const handleSave = async () => {
    try {
      setSaving(true);
      setNotice("");

      const response = await apiFetch("settings/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: profile.name,
          bio: profile.bio,
          notifications,
          appearance,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not save your settings."
        );
      }

      setNotice("Settings saved successfully!");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="settings-page">
        <div className="settings-panel">
          <p>Loading your account settings...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-page">
      <div className="settings-heading">
        <div>
          <h2>Settings</h2>
          <p>Manage your SocialFlow preferences and account.</p>
        </div>
      </div>

      {notice && (
        <div className="settings-notice">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-sidebar">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        <div className="settings-content">

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div className="settings-panel">
              <div className="settings-panel-heading">
                <h3>Profile Information</h3>
                <p>Manage your personal profile details.</p>
              </div>

              <div className="settings-avatar-section">
                <div className="settings-avatar">
                  {profile.name.charAt(0).toUpperCase() || "S"}
                </div>

                <div>
                  <h4>{profile.name}</h4>
                  <p>Your SocialFlow profile</p>
                </div>
              </div>

              <div className="settings-form">
                <label>
                  Display Name
                  <input
                    value={profile.name}
                    onChange={(e) =>
                      updateProfile("name", e.target.value)
                    }
                    placeholder="Your name"
                  />
                </label>

                <label>
                  Username
                  <input
                    value={profile.username}
                    readOnly
                    title="Username changes will be added separately."
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                  />
                </label>

                <label>
                  Bio
                  <textarea
                    value={profile.bio}
                    onChange={(e) =>
                      updateProfile("bio", e.target.value)
                    }
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </label>
              </div>

              <button
                className="primary-button settings-save-button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="settings-panel">
              <div className="settings-panel-heading">
                <h3>Appearance</h3>
                <p>Choose how SocialFlow looks on your device.</p>
              </div>

              <div className="settings-options">
                {[
                  {
                    id: "dark",
                    name: "Dark Mode",
                    description: "A dark interface for comfortable viewing.",
                    icon: Moon,
                  },
                  {
                    id: "light",
                    name: "Light Mode",
                    description: "A bright interface with light backgrounds.",
                    icon: Sun,
                  },
                  {
                    id: "system",
                    name: "System Default",
                    description: "Follow your device appearance settings.",
                    icon: Monitor,
                  },
                ].map((option) => {
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.id}
                      className={`settings-option ${
                        appearance === option.id ? "selected" : ""
                      }`}
                      onClick={() => setAppearance(option.id)}
                    >
                      <Icon size={22} />

                      <div>
                        <strong>{option.name}</strong>
                        <p>{option.description}</p>
                      </div>

                      <span className="settings-radio">
                        {appearance === option.id ? "●" : "○"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                className="primary-button settings-save-button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Appearance"}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="settings-panel">
              <div className="settings-panel-heading">
                <h3>Notification Preferences</h3>
                <p>Choose which notifications you want to receive.</p>
              </div>

              <div className="settings-notification-list">
                {[
                  {
                    id: "scheduled",
                    title: "Scheduled Posts",
                    description: "Get notified about upcoming scheduled posts.",
                  },
                  {
                    id: "published",
                    title: "Published Posts",
                    description: "Get notified when posts are published.",
                  },
                  {
                    id: "failed",
                    title: "Failed Posts",
                    description: "Get notified when a post fails.",
                  },
                  {
                    id: "reminders",
                    title: "Reminders",
                    description: "Receive reminders about your content schedule.",
                  },
                ].map((item) => (
                  <div
                    className="settings-notification-item"
                    key={item.id}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>

                    <button
                      className={`settings-toggle ${
                        notifications[item.id] ? "enabled" : ""
                      }`}
                      onClick={() => toggleNotification(item.id)}
                      aria-label={`Toggle ${item.title}`}
                    >
                      <span />
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="primary-button settings-save-button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Notifications"}
              </button>
            </div>
          )}

          {/* ACCOUNT */}
          {activeTab === "account" && (
            <div className="settings-panel">
              <div className="settings-panel-heading">
                <h3>Account Management</h3>
                <p>Manage your account security and access.</p>
              </div>

              <div className="settings-account-item">
                <div className="settings-account-icon">
                  <Mail size={20} />
                </div>

                <div>
                  <strong>Email Address</strong>
                  <p>{profile.email}</p>
                </div>
              </div>

              <div className="settings-account-item">
                <div className="settings-account-icon">
                  <Lock size={20} />
                </div>

                <div>
                  <strong>Password & Security</strong>
                  <p>Password management will be connected separately.</p>
                </div>
              </div>

              <div className="settings-account-warning">
                <Shield size={20} />
                <div>
                  <strong>Account Security</strong>
                  <p>
                    Your account is protected by SocialFlow authentication.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
