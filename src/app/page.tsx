"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlanningPoker() {
  const [user, setUser] = useState("");

  const router = useRouter();

  const joinRoom = () => {
    if (user) {
      router.push(`/rooms/1?name=${user}`);
    }
  };

  return (
    <div className="grid grid-cols-1 h-60">
      <div className="justify-self-center self-center">
        <div className="w-full max-w-sm min-w-[200px] relative mt-4">
          <label className="block mb-2 text-md text-slate-600">
            Planning Poker
          </label>

          <div className="relative">
            <input
              type="text"
              className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md pl-3 pr-20 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
              placeholder="Enter your name"
              onChange={(event) => setUser(event.target.value)}
            />
            <button
              className="absolute right-1 top-1 rounded bg-light-blue-600 py-1 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              onClick={joinRoom}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
