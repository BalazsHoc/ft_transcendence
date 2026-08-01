import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { User } from "../../types/api";
import { updateMe } from "../../api/authApi";
import Button from "../shared/Button";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../../utils/media";

const fieldLabelClasses = "mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]";

type ProfileEditFormProps = {
  user: User | null;
  onSaved: () => void;
  onCancel: () => void;
};

export function ProfileEditForm({ user, onSaved, onCancel }: ProfileEditFormProps) {
  const { t } = useTranslation();
  const [district, setDistrict] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState("");
  const [interests, setInterests] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    resolveMediaUrl(user?.avatar, DEFAULT_AVATAR_SRC),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setDistrict(user?.district || "");
    setBio(user?.bio || "");
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
        bio,
        languages: languages.split(",").map((x) => x.trim()).filter(Boolean),
        interests: interests.split(",").map((x) => x.trim()).filter(Boolean),
        avatarFile,
      });
      onSaved();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-6xl rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-8 shadow-sm">
      <h2 className="mb-6 font-display text-xl font-semibold text-[var(--text)]">{t("profile.editProfile")}</h2>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <img
            src={avatarPreview}
            alt="Avatar preview"
            className="h-24 w-24 rounded-full border-4 border-[var(--surface)] object-cover shadow-lg"
            onError={(e: any) => {
              e.currentTarget.src = DEFAULT_AVATAR_SRC;
            }}
          />
          <label className="cursor-pointer text-xs font-medium uppercase tracking-wider text-[var(--muted)] hover:text-[var(--text)]">
            {t("profile.logo")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAvatarFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={fieldLabelClasses}>{t("profile.district")}</span>
            <input value={district} onChange={(e: ChangeEvent<HTMLInputElement>) => setDistrict(e.target.value)} />
          </label>
          <label className="sm:col-span-2">
            <span className={fieldLabelClasses}>{t("profile.bio")}</span>
            <textarea value={bio} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)} rows={4} />
          </label>
          <label>
            <span className={fieldLabelClasses}>{t("profile.languagesCsv")}</span>
            <input value={languages} onChange={(e: ChangeEvent<HTMLInputElement>) => setLanguages(e.target.value)} />
          </label>
          <label>
            <span className={fieldLabelClasses}>{t("profile.interestsCsv")}</span>
            <input value={interests} onChange={(e: ChangeEvent<HTMLInputElement>) => setInterests(e.target.value)} />
          </label>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>{t("profile.cancel")}</Button>
        <Button variant="primary" onClick={save}>{t("profile.save")}</Button>
      </div>
    </div>
  );
}
