import { atom } from 'recoil';

export interface useSessionData {
  id: string
  email: string
  name: string
  image: string 
}

export const userAtom = atom<null | useSessionData>({
  key: 'userAtom',
  default: null,
});
