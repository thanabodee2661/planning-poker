"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { io, Socket } from "socket.io-client";
import { v7 } from "uuid";

export default function PlanningPoker() {
  const [user, setUser] = useState("");
  const [room, setRoom] = useState("room1");
  const [vote, setVote] = useState<number | null>(null);
  const [votes, setVotes] = useState<{ id: string; vote: number }[]>([]);

  const router = useRouter();

  const socket = io("https://planning-poker-backend-7ii7.onrender.com");
  // const socket = io("http://localhost:3001");
  //     setSocket(socketInstance);

  //     socketInstance.emit('joinRoom', room);

  // useEffect(() => {
  //   socket.on('new-vote', (data: any) => {
  //     setVotes((prevVotes) => [...prevVotes, { id: data.id, vote: data.vote }]);
  //   });

  //   return () => {
  //     socket.off('new-vote');
  //   };
  // }, [socket]);


  const handleVote = (value: number) => {
    setVote(value);
    socket?.emit("vote", { room, id: socket.id, vote: value });
  };

  const joinRoom = () => {
    console.log("joining room ...");
    router.push(`/pages/rooms/1?name=${user}`)
  };

  const voteResult = () => {
    socket.on("voteResult", (result) => {
      console.log(result);
    });
  };

  return (
    <div>
      <h1>Planning Poker</h1>
      <form className="w-full max-w-sm">
        <div className="flex items-center border-b border-teal-500 py-2">
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            placeholder="Enter your name"
            aria-label="Full name"
            onChange={(event) => setUser(event.target.value)}
          />
          <button
            className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded"
            type="button"
            onClick={joinRoom}
          >
            Join
          </button>
        </div>
      </form>
    </div>
  );
}
