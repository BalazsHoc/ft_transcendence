import { useEffect, useState, type ChangeEvent } from "react";
import { User } from "../../types/api";
import { updateMe } from "../../api/authApi";
import { ApiLog } from "../shared/ApiLog";
import Button from "../shared/Button";
import styles from "../shared/FormCard.module.css";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../../utils/media";

type ProfileEditFormProps = {
  user: User | null;
  onSaved: () => void;
  onCancel: () => void;
};

export function ProfileEditForm({ user, onSaved, onCancel }: ProfileEditFormProps) {
  const [district, setDistrict] = useState("");
  const [languages, setLanguages] = useState("");
  const [interests, setInterests] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    resolveMediaUrl(user?.avatar, DEFAULT_AVATAR_SRC),
  );
  const [log, setLog] = useState("");

  useEffect(() => {
    setDistrict(user?.district || "");
    setLanguages((user?.languages || []).join(","));
    setInterests((user?.interests || []).join(","));
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(resolveMediaUrl(user?.avatar, DEFAULT_AVATAR_SRC));
      return;
    }
    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile, user?.avatar]);

  async function save() {
    try {
      await updateMe({
        district,
        languages: languages.split(",").map((x) => x.trim()).filter(Boolean),
        interests: interests.split(",").map((x) => x.trim()).filter(Boolean),
        avatarFile,
      });
      onSaved();
    } catch (e: any) {
      setLog(e.message);
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-6xl rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-8 shadow-sm">
      <h2 className="mb-4 font-display text-xl font-semibold text-[var(--text)]">Edit profile</h2>
      <div className={styles.formCard}>
        <label>
          Avatar
          <input
            type="file"
            accept="image/*"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAvatarFile(e.target.files?.[0] || null)}
          />
        </label>
        <img
          src={avatarPreview}
          alt="Avatar preview"
          className="h-24 w-24 rounded-full object-cover"
          onError={(e: any) => {
            e.currentTarget.src = DEFAULT_AVATAR_SRC;
          }}
        />
        <label>
          District
          <input value={district} onChange={(e: ChangeEvent<HTMLInputElement>) => setDistrict(e.target.value)} />
        </label>
        <label>
          Languages (comma separated)
          <input value={languages} onChange={(e: ChangeEvent<HTMLInputElement>) => setLanguages(e.target.value)} />
        </label>
        <label>
          Interests (comma separated)
          <input value={interests} onChange={(e: ChangeEvent<HTMLInputElement>) => setInterests(e.target.value)} />
        </label>
        <div className="row">
          <Button variant="primary" onClick={save}>Save</Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
      <ApiLog log={log} />
    </div>
  );
}
