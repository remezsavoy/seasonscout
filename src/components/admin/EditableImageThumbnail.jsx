import { Pencil } from 'lucide-react';

export function EditableImageThumbnail({ alt, imageUrl, onClick, className = '' }) {
  return (
    <button
      className={`group relative overflow-hidden rounded-[1.25rem] bg-ink/8 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lagoon/35 ${className}`}
      onClick={onClick}
      type="button"
    >
      {imageUrl ? <img alt={alt} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" src={imageUrl} /> : null}
      <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition duration-200 group-hover:bg-ink/45 group-focus-visible:bg-ink/45">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white opacity-0 ring-1 ring-white/30 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <Pencil className="h-5 w-5" />
        </span>
      </div>
    </button>
  );
}
