/** Where a file stands. Waiting for a free place in the queue, going, there, or not. */
export type UploadStatus = 'waiting' | 'uploading' | 'done' | 'error'

/**
 * Why a file is not there. The first three are the kit's own refusals, said
 * before anything is sent, and a retry would not change them; `failed` is the
 * upload's answer, and may be tried again.
 */
export type UploadErrorCode = 'too-large' | 'wrong-type' | 'too-many' | 'failed'

export interface UploadItem {
  id: string
  name: string
  /** Bytes; null for a file already there whose size was not given. */
  size: number | null
  /** The MIME type, as the browser reported it; may be empty. */
  type: string
  status: UploadStatus
  /** 0 to 1 while it goes; null while the upload has not said how far. */
  progress: number | null
  error: UploadErrorCode | null
  /** The upload's own words for a failure — a rejection's message — shown instead of the kit's. */
  message: string | null
  /** What the upload answered: submitted under the field's name. */
  value: string | null
  /** Where a file already there can be seen: a tile's picture. */
  url: string | null
  /** Counts the tries, so the answer to an abandoned one is not taken for the next. */
  attempt: number
  /** The file itself; null for one already there. */
  file: File | null
}

export interface UploadOptions {
  /** An `accept` list, as the file input's: checked again on every file, dropped ones too. */
  accept: string | null
  /** The most bytes a file may have. */
  maxSize: number | null
  /** The most files the list may hold, refused ones aside. */
  maxFiles: number | null
  /** How many go at once. Default 3. */
  concurrency: number
  disabled: boolean
}

export interface UploadState extends UploadOptions {
  id: string
  items: UploadItem[]
  /** Numbers the files added, for their ids. */
  seq: number
  /** The last thing worth saying out loud: a file there, or failed. */
  said: { id: string; name: string; what: 'done' | 'error'; nonce: number } | null
}

/** A file the list starts with: already uploaded, shown as done. */
export interface UploadedFile {
  name: string
  size?: number | null
  /** Submitted under the field's name. Default: the name. */
  value?: string | null
  url?: string | null
}

export type UploadEvent =
  | { type: 'ADD'; files: File[] }
  | { type: 'PROGRESS'; id: string; attempt: number; loaded: number; total?: number | null }
  | { type: 'SETTLED'; id: string; attempt: number; ok: boolean; value?: string | null; message?: string | null }
  /** Stops a file going or waiting, and takes it off the list. */
  | { type: 'CANCEL'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'RETRY'; id: string }
  | { type: 'RESET'; files: UploadedFile[] }
  | ({ type: 'SYNC_OPTIONS' } & Partial<UploadOptions>)

/** What the upload is handed besides the file. */
export interface UploadContext {
  /** Aborts when the file is cancelled or removed, or the component goes. Pass it to fetch. */
  signal: AbortSignal
  /** How far it has gone, in bytes. Without a total, the row says it is going but not how far. */
  onProgress: (loaded: number, total?: number | null) => void
}

/**
 * Sends one file. Resolve with what the form should submit for it — an id, a
 * key, a URL — or nothing, and the file's name stands in. Reject, or throw,
 * and the file is marked failed with the rejection's message, and may be retried.
 */
export type UploadFunction = (file: File, context: UploadContext) => unknown

export interface UploadWords {
  /** The list's name for a screen reader. Default "Files". */
  list?: string
  /** A file waiting for its turn. Default "Waiting". */
  waiting?: string
  /** The progress bar's name. Default "Uploading {name}". */
  uploading?: (name: string) => string
  /** Default "Retry". */
  retry?: string
  /** The buttons' names, with the file's. Defaults "Retry {name}", "Cancel {name}", "Remove {name}". */
  retryFile?: (name: string) => string
  cancelFile?: (name: string) => string
  removeFile?: (name: string) => string
  /** Default "Too large — the limit is {limit}". */
  tooLarge?: (limit: string) => string
  /** Default "Not a type this takes". */
  wrongType?: string
  /** Default "Too many — up to {max} files". */
  tooMany?: (max: number) => string
  /** A failure the upload gave no words for. Default "Upload failed". */
  failed?: string
  /** Said when a file is there. Default "{name} uploaded". */
  saidDone?: (name: string) => string
  /** Said when a file fails. Default "{name} failed: {reason}". */
  saidError?: (name: string, reason: string) => string
}
