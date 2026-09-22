/**
 * What happened to a file. A closed axis of its own, not the tone vocabulary:
 * a deletion is what someone meant to do, not an error. Only `conflict` is
 * also a judgement, and only it is painted as one.
 */
export type FileChangeKind = 'added' | 'modified' | 'deleted' | 'renamed' | 'conflict'

export interface FileChangeProps {
  change: FileChangeKind
}

/** What each change is called aloud. Default: English. */
export type FileChangeWords = Partial<Record<FileChangeKind, string>>
