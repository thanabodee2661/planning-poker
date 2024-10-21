// import { useEffect, useState } from 'react';
// import { io, Socket } from 'socket.io-client';

// const useSocket = (room: string) => {
//   const [socket, setSocket] = useState<Socket | null>(null);

//   useEffect(() => {
//     const socketInstance = io('http://localhost:3001');
//     setSocket(socketInstance);

//     socketInstance.emit('joinRoom', room);

//     return () => {
//       socketInstance.disconnect();
//     };
//   }, [room]);

//   return socket;
// };

// export default useSocket;
