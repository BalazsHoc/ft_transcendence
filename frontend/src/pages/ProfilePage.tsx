import { useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { ProfileSideNav } from "../components/profile/ProfileSideNav";
import { ProfileHero } from "../components/profile/ProfileHero";
import { ProfileEditForm } from "../components/profile/ProfileEditForm";
import { ProfileScoreCard } from "../components/profile/ProfileScoreCard";
import { ProfileActivityTimeline } from "../components/profile/ProfileActivityTimeline";
import { ProfileAbout } from "../components/profile/ProfileAbout";
import { ProfileAchievements } from "../components/profile/ProfileAchievements";

export function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const [editing, setEditing] = useState(false);

  return (
    <div className="profile-page-full flex items-start">
      <ProfileSideNav />

      <div className="min-w-0 flex-1 pb-16">
        <ProfileHero user={user} onEditClick={() => setEditing(true)} />

        {editing && (
          <ProfileEditForm
            user={user}
            onSaved={async () => {
              await refreshMe();
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        )}

        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 px-4 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <ProfileScoreCard />
            <ProfileActivityTimeline />
          </div>
          <div className="space-y-6 lg:col-span-4">
            <ProfileAbout user={user} />
            <ProfileAchievements />
          </div>
        </div>
      </div>
    </div>
  );
}
