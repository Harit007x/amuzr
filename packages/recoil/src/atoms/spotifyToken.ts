import { atom } from 'recoil';

export interface spotifyTokenData {
  token: string
}

export const spotifyAtom = atom<null | spotifyTokenData>({
  key: 'spotifyTokenAtom',
  default: null,
});
