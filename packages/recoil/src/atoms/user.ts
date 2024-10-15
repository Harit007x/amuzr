import { atom } from 'recoil';

export interface useSessionData {
  user_id: string
  username: string
  name: string
}

export const userAtom = atom<null | useSessionData>({
  key: 'userAtom',
  default: null,
});
