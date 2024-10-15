'use client';
import { userAtom } from '@repo/recoil';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';

const SessionChange = () => {
  const session = useSession();
  // console.log('session change =', session)
  const setUser = useSetRecoilState(userAtom);
  useEffect(() => {
    setUser({
      // @ts-ignore
      user_id: session?.data?.user?.id,
      // @ts-ignore
      username: session?.data?.user?.email,
      // @ts-ignore
      name: session?.data?.user?.name,
    });
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
