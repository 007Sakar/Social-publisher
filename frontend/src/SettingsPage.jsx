
import { useEffect, useState } from "react";
import {
  User,
  Palette,
  Bell,
  Shield,
  Save,
  Camera,
  Moon,
  Sun,
  Monitor,
  Mail,
  Lock,
  CheckCircle2,
} from "lucide-react";

import "./SettingsPage.css";


function loadSetting(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function SettingsPage({ appearance, setAppearance }) {
  const [activeTab, setActiveTab] = useState("profile");

 const [profile, setProfile] = useState(() =>
  loadSetting("socialflow_profile", {
    name: "SocialFlow User",
    email: "",
    username: "socialflow_user",
    bio: "",
  })
);

 

  const [notifications, setNotifications] = useState(() =>
  loadSetting("socialflow_notifications", {
    scheduled: true,
    published: true,
    failed: true,
    reminders: true,
  })
);

useEffect(() => {
  localStorage.setItem("socialflow_profile", JSON.stringify(profile));
  
  localStorage.setItem(
    "socialflow_notifications",
    JSON.stringify(notifications)
  );
}, [profile, appearance, notifications]);

  const [notice, setNotice] = useState("");

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

  const handleSave = () => {
    setNotice("Settings saved successfully.");

    setTimeout(() => {
      setNotice("");
    }, 3000);
  };

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
                className={
                  activeTab === tab.id ? "active" : ""
                }
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        <div className="settings-content">

          {/* Profile */}
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
                    onChange={(e) =>
                      updateProfile("username", e.target.value)
                    }
                    placeholder="Username"
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      updateProfile("email", e.target.value)
                    }
                    placeholder="Your email address"
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
              >
                <Save size={16} />
                Save Profile
              </button>
            </div>
          )}

          {/* Appearance */}
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
                      onClick={() => {
                        setAppearance(option.id);
                        setNotice(
                          "Appearance preference selected. Theme integration will be added next."
                        );
                      }}
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
              >
                <Save size={16} />
                Save Appearance
              </button>
            </div>
          )}

          {/* Notifications */}
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
              >
                <Save size={16} />
                Save Notifications
              </button>
            </div>
          )}

          {/* Account */}
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
                  <p>Manage the email associated with your account.</p>
                </div>
              </div>

              <div className="settings-account-item">
                <div className="settings-account-icon">
                  <Lock size={20} />
                </div>

                <div>
                  <strong>Password & Security</strong>
                  <p>Password management will be connected to authentication.</p>
                </div>
              </div>

              <div className="settings-account-warning">
                <Shield size={20} />
                <div>
                  <strong>Account Security</strong>
                  <p>
                    Authentication and account management are not
                    connected yet.
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
