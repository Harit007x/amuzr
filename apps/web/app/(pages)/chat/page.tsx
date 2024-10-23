import { SocketProvider } from '../../socketContext';
import Chat from '../../../components/chat';

export default function Home() {

  return (
    <SocketProvider meeting_id={'xhx-xhx'}>
      <Chat/>
    </SocketProvider>
  );
}