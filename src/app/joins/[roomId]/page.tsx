"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading";

export default function PlanningPoker() {
  const [user, setUser] = useState<string>("");
  const [init, setInit] = useState<Boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const name = sessionStorage.getItem("name") || "";
    setUser(name);
    setInit(true);
  }, [user]);

  const joinRoom = () => {
    if (user) {
      sessionStorage.setItem("name", user);
      router.push(`/rooms/1`);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      joinRoom();
    }
  };

  return (
    <>
      {!init ? (
        <Loading></Loading>
      ) : (
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
                  value={user}
                  onChange={(event) => setUser(event.target.value)}
                  onKeyDown={handleKeyDown} 
                  autoFocus
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
      )}
    </>
  );
}
