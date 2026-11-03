"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { IconClose, IconPlus } from "@/components/ui/Icons";
import { useFeed } from "@/components/feed/FeedProvider";
import { kids as mockKids } from "@/lib/mocks/kids";
import { buildPost, POST_TYPES, roomKids, validateNewPost } from "@/lib/posts";
import type {
  NewPostFieldErrors,
  NewPostFormValues,
  NewPostRecipient,
  PostPhoto,
} from "@/lib/types/feed";

const ROOM_KIDS = roomKids(mockKids);

const INITIAL_RECIPIENT: NewPostRecipient = ROOM_KIDS.length
  ? `kid:${ROOM_KIDS[0].id}`
  : "room";

const INITIAL_VALUES: NewPostFormValues = {
  recipients: [INITIAL_RECIPIENT],
  type: "meal",
  text: "",
  photos: [],
};

export function CreatePostDialog() {
  const { isComposerOpen, closeComposer } = useFeed();

  return (
    <Modal
      open={isComposerOpen}
      onClose={closeComposer}
      title="Nueva publicación"
      size="lg"
    >
      {/* Remontar el form en cada apertura resetea values, errores y fotos. */}
      {isComposerOpen && <CreatePostForm />}
    </Modal>
  );
}

function CreatePostForm() {
  const { addPost, closeComposer, notify } = useFeed();
  const [values, setValues] = useState<NewPostFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<NewPostFieldErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<PostPhoto[]>([]);
  // Evita revocar los object URLs de fotos ya publicadas al desmontar.
  const keepPhotosRef = useRef(false);

  useEffect(() => {
    photosRef.current = values.photos;
  }, [values.photos]);

  useEffect(() => {
    return () => {
      if (keepPhotosRef.current) return;
      for (const photo of photosRef.current) {
        if (photo.src) URL.revokeObjectURL(photo.src);
      }
    };
  }, []);

  const setText = (text: string) => {
    setValues((prev) => ({ ...prev, text }));
    setErrors((prev) => {
      if (prev.text === undefined) return prev;
      const next = { ...prev };
      delete next.text;
      return next;
    });
  };

  const toggleRecipient = (recipient: NewPostRecipient) => {
    setValues((prev) => {
      const isSelected = prev.recipients.includes(recipient);

      // "Toda la sala" es exclusivo y no se puede deseleccionar si es el único.
      if (recipient === "room") {
        if (isSelected) return prev;
        return { ...prev, recipients: ["room"] };
      }

      if (isSelected) {
        if (prev.recipients.length === 1) return prev;
        return {
          ...prev,
          recipients: prev.recipients.filter((item) => item !== recipient),
        };
      }

      return {
        ...prev,
        recipients: [
          ...prev.recipients.filter((item) => item !== "room"),
          recipient,
        ],
      };
    });
  };

  const removePhoto = (src: string | undefined) => {
    if (src) URL.revokeObjectURL(src);
    setValues((prev) => ({
      ...prev,
      photos: prev.photos.filter((photo) => photo.src !== src),
    }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setValues((prev) => ({
      ...prev,
      photos: [
        ...prev.photos,
        { alt: file.name, src: URL.createObjectURL(file) },
      ],
    }));
  };

  const handleCancel = () => {
    for (const photo of values.photos) {
      if (photo.src) URL.revokeObjectURL(photo.src);
    }
    keepPhotosRef.current = true;
    closeComposer();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateNewPost(values);
    if (nextErrors.text) {
      setErrors(nextErrors);
      return;
    }
    keepPhotosRef.current = true;
    addPost(buildPost(values, ROOM_KIDS, new Date()));
    closeComposer();
    notify("Publicación creada");
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-canvas-soft px-4 py-5 sm:px-[26px]">
        <button
          type="button"
          onClick={handleCancel}
          className="text-[15px] font-bold text-muted"
        >
          Cancelar
        </button>
        <span className="whitespace-nowrap font-fredoka text-[18px] font-semibold text-text">
          Nueva publicación
        </span>
        <button type="submit" className="text-[15px] font-extrabold text-accent">
          Publicar
        </button>
      </div>

      <div className="px-4 py-6 sm:px-[26px]">
        <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-muted">
          PARA
        </div>
        <div className="mb-[22px] flex flex-wrap gap-[9px]">
          {ROOM_KIDS.map((kid) => {
            const recipient = `kid:${kid.id}` as const;
            const selected = values.recipients.includes(recipient);
            return (
              <button
                key={kid.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleRecipient(recipient)}
                className={`flex items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold ${
                  selected
                    ? "border-text bg-text text-white"
                    : "border-line bg-surface text-text-3"
                }`}
              >
                <span
                  className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full font-fredoka text-[13px] font-semibold"
                  style={{
                    background: kid.avatarBg,
                    color: kid.avatarText,
                  }}
                >
                  {kid.initial}
                </span>
                {kid.name.split(" ")[0]}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={values.recipients.includes("room")}
            onClick={() => toggleRecipient("room")}
            className={`rounded-full border-[1.5px] px-4 py-[6px] text-[14px] font-bold ${
              values.recipients.includes("room")
                ? "border-text bg-text text-white"
                : "border-line bg-surface text-text-3"
            }`}
          >
            Toda la sala
          </button>
        </div>

        <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-muted">
          TIPO
        </div>
        <div className="mb-[22px] flex flex-wrap gap-[9px]">
          {POST_TYPES.map((type) => {
            const selected = values.type === type.value;
            return (
              <button
                key={type.value}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setValues((prev) => ({ ...prev, type: type.value }))
                }
                style={{
                  background: type.solidBg,
                  color: type.solidText,
                  outline: selected ? `2px solid ${type.dot}` : undefined,
                  outlineOffset: selected ? "2px" : undefined,
                }}
                className="rounded-full px-4 py-2 text-[13.5px] font-extrabold"
              >
                {type.label}
              </button>
            );
          })}
        </div>

        <FormField
          label="DESCRIPCIÓN"
          labelClassName="font-extrabold"
          placeholder="Contá cómo le fue hoy…"
          textarea
          value={values.text}
          onChange={setText}
          error={errors.text}
          autoFocus
          className="mb-[22px]"
          inputClassName="min-h-[120px]! resize-y"
        />

        <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-muted">
          FOTOS
        </div>
        <div className="flex flex-wrap gap-3">
          {values.photos.map((photo, index) => (
            <div
              key={`${photo.src}-${index}`}
              className="relative h-24 w-24 overflow-hidden rounded-[14px] border border-line bg-[#F4ECE1]"
            >
              {photo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <button
                type="button"
                aria-label="Quitar foto"
                onClick={() => removePhoto(photo.src)}
                className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/90 text-text shadow-[0_2px_6px_-2px_rgba(63,54,46,.5)]"
              >
                <IconClose size={13} strokeWidth={2.4} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
          >
            <IconPlus size={22} className="text-accent-2" />
            <span className="text-[12px]">Agregar</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </form>
  );
}
