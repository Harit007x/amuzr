'use client';
import { userAtom, useSessionData } from '@repo/recoil';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';

const SessionChange = () => {
  const session = useSession();
  // console.log('session change =', session?.data?.user)
  const setUser = useSetRecoilState(userAtom);
  useEffect(() => {
    const user = session.data?.user as useSessionData;
    if(user){
      setUser(user);
    }
  }, [session]);
  // if (session.status === 'loading') {
  //     return(
  //         <main className="fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center ">
  //             <Icons.spinner className="mr-2 h-8 w-8 animate-spin" />
  //         </main>
  //     )
  // }
  return null;
};

export default SessionChange;
