import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { User } from "../../types/api";
import { updateMe } from "../../api/authApi";
import Button from "../shared/Button";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../../utils/media";
import { useDistricts } from "../../hooks/useDistricts";
import { useSports } from "../../hooks/useSports";
import { PROFILE_LANGUAGE_CODES } from "../../data/profileLanguages";

const fieldLabelClasses = "mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]";

type ProfileEditFormProps = {
  user: User | null;
  onSaved: () => void;
  onCancel: () => void;
};

export function ProfileEditForm({ user, onSaved, onCancel }: ProfileEditFormProps) {
  const { t } = useTranslation();
  const districts = useDistricts();
  const sports = useSports();
  const [district, setDistrict] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [sportsSelection, setSportsSelection] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    resolveMediaUrl(user?.avatar, DEFAULT_AVATAR_SRC),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setDistrict(user?.district || "");
    setBio(user?.bio || "");
    setLanguages([...(user?.languages || [])]);
    // The API keeps this profile list in `interests` for backwards compatibility.
    setSportsSelection([...(user?.interests || [])]);
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
        languages,
        interests: sportsSelection,
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
            <select
              value={district}
              disabled={districts.length === 0}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setDistrict(e.target.value)}
            >
              <option value="">{t("auth.selectDistrict")}</option>
              {districts.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.code} — {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className={fieldLabelClasses}>{t("profile.bio")}</span>
            <textarea value={bio} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)} rows={4} />
          </label>
          <fieldset>
            <legend className={fieldLabelClasses}>{t("profile.languages")}</legend>
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-[var(--radius-button)] border border-[var(--control-border)] p-3 sm:grid-cols-2">
              {PROFILE_LANGUAGE_CODES.map((code) => (
                <label key={code} className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
                  <input
                    type="checkbox"
                    className="!h-4 !w-4 !p-0"
                    checked={languages.includes(code)}
                    onChange={() =>
                      setLanguages((current) =>
                        current.includes(code)
                          ? current.filter((value) => value !== code)
                          : [...current, code],
                      )
                    }
                  />
                  {t(`languageNames.${code}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={fieldLabelClasses}>{t("profile.sports")}</legend>
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-[var(--radius-button)] border border-[var(--control-border)] p-3 sm:grid-cols-2">
              {sports.length > 0 ? (
                sports.map((sportOption) => (
                  <label key={sportOption.code} className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
                    <input
                      type="checkbox"
                      className="!h-4 !w-4 !p-0"
                      checked={sportsSelection.includes(sportOption.code)}
                      onChange={() =>
                        setSportsSelection((current) =>
                          current.includes(sportOption.code)
                            ? current.filter((value) => value !== sportOption.code)
                            : [...current, sportOption.code],
                        )
                      }
                    />
                    {t(`sports.${sportOption.code}`, { defaultValue: sportOption.code })}
                  </label>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">{t("profile.loadingSports")}</p>
              )}
            </div>
          </fieldset>
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
