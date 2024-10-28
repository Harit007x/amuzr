import { atom } from 'recoil';

export const queueState = atom<any>({
  key: 'queueState',
  default: [],
});

export const currentSongState = atom<any>({
  key: 'currentSongState',
  default: null,
});

export const isPlayingState = atom<boolean>({
  key: 'isPlayingState',
  default: false,
});

export const progressState = atom<number>({
  key: 'progressState',
  default: 0,
});

export const durationState = atom<number>({
  key: 'durationState',
  default: 0,
});

export const volumeState = atom<number>({
  key: 'volumeState',
  default: 50,
});

export const searchResultsState = atom<any>({
  key: 'searchResultsState',
  default: [],
});

export const isSearchOpenState = atom<boolean>({
  key: 'isSearchOpenState',
  default: false,
});