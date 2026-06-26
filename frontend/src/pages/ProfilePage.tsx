import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/auth/AuthContext";
import { updateMe } from "../api/authApi";
import { ApiLog } from "../components/shared/ApiLog";
import styles from "../components/shared/FormCard.module.css";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../utils/media";

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, refreshMe } = useAuth();
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
      const data = await updateMe({
        district,
        languages: languages.split(",").map((x) => x.trim()).filter(Boolean),
        interests: interests.split(",").map((x) => x.trim()).filter(Boolean),
        avatarFile,
      });
      await refreshMe();
      setAvatarFile(null);
      setLog(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setLog(e.message);
    }
  }

  return (
    <>
      <h1>{t("profile.title")}</h1>
      <section className={styles.formCard}>
        <p>Username: {user?.username || "not logged in"}</p>
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
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "999px",
            objectFit: "cover",
          }}
          onError={(event: any) => {
            event.currentTarget.src = DEFAULT_AVATAR_SRC;
          }}
        />
        <label>
          District
          <input value={district} onChange={(e: ChangeEvent<HTMLInputElement>) => setDistrict(e.target.value)} />
        </label>
        <label>
          Languages
          <input value={languages} onChange={(e: ChangeEvent<HTMLInputElement>) => setLanguages(e.target.value)} />
        </label>
        <label>
          Interests
          <input value={interests} onChange={(e: ChangeEvent<HTMLInputElement>) => setInterests(e.target.value)} />
        </label>
        <button onClick={save}>{t("profile.update")}</button>
      </section>
      <ApiLog log={log} />
    </>
  );
}
