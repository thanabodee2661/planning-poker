"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { v7 } from "uuid";
import { groupBy } from "../../../utils/common";

interface UserDetail {
  id: string;
  name: string;
  vote: string;
}

export default function Rooms({ params }: { params: { roomId: string } }) {
  const [detail, setDetail] = useState<UserDetail>();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [point, setPoint] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isShowVote, setIsShowVote] = useState<boolean>(false);
  const [resultVote, setResultVote] = useState<Record<string, UserDetail[]>>();

  const searchParams = useSearchParams();
  const router = useRouter();
  const socket = io("https://planning-poker-backend-7ii7.onrender.com");
  // const socket = io("http://localhost:3001");

  const name = searchParams.get("name");

  useEffect(() => {
    if (name) {
      const uuid = v7();
      setDetail({ id: uuid, name: name } as UserDetail);
      socket.emit("joinRoom", { roomId: 1, id: uuid, name: name });
    } else {
      router.replace("/");
    }
  }, [name]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("usersInRoom", (clientInfo: any) => {
      const userList = clientInfo.clients.map((c: any) => {
        if (c.userDetail) {
          return c.userDetail;
        }
      });
      setUsers(userList);
    });

    socket.on("voteResult", (data: any) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === data.userDetail.id ? { ...user, vote: data.vote } : user
        )
      );
    });

    socket.on("messageResult", (message) => {
      setMessage(message);
    });

    socket.on("clearResult", () => {
      setMessage("");
      setIsShowVote(false);
      setUsers((users) =>
        users.map((user) => ({
          ...user,
          vote: "",
        }))
      );
      setResultVote(undefined);
    });

    socket.on("showVoteResult", () => {
      setIsShowVote(true);
    });

    socket.on("summaryVoteResult", (resultVote) => {
      setResultVote(resultVote);
    });

    return () => {
      socket.off("usersInRoom");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  useEffect(() => {
    if (isShowVote) {
      summarize();
    }
  }, [users]);

  const handleVote = async (value: string) => {
    setPoint(value);
    setUsers((prevUsers) => {
      return prevUsers.map((user) =>
        user.id === detail?.id ? { ...user, vote: value } : user
      );
    });

    socket?.emit("vote", { roomId: 1, userDetail: detail, vote: value });
  };

  const handleClear = () => {
    socket?.emit("clear", { roomId: 1, userDetail: detail });
  };

  const handleMessage = (e: any) => {
    socket?.emit("message", {
      roomId: 1,
      userDetail: detail,
      message: e.target.value,
    });
  };

  const handleShowVote = async () => {
    await summarize();
    socket?.emit("showVote", {
      roomId: 1,
      userDetail: detail,
    });
  };

  const summarize = async () => {
    const resultVote = await groupBy(users, (user) => user.vote);
    socket?.emit("summaryVote", {
      roomId: 1,
      userDetail: detail,
      resultVote: resultVote,
    });
  };

  return (
    <div className="grid grid-cols-1 mt-10 mx-10 gap-4 lg:grid-cols-2">
      <div className="justify-self-center lg:justify-self-end">
        <div className="grid grid-cols-1 justify-self-center w-96 mb-2">
          <label className="block mb-2 text-md text-slate-600">
            Room ID: {params.roomId}
          </label>

          <div className="relative w-full">
            <textarea
              className="peer h-full min-h-[100px] w-full resize-none rounded-[7px] border border-white border-t-transparent bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-white outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-white placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-white focus:border-t-transparent focus:outline-0 disabled:resize-none disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
              value={message}
              onChange={handleMessage}
            ></textarea>
            <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[12px] font-normal leading-tight text-white transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-white before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-white after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-white peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-white peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-white peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              Message
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-96 justify-self-center mb-2">
          <button
            className="rounded-md bg-green-600 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-green-700 focus:shadow-none active:bg-green-700 hover:bg-green-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
            onClick={handleShowVote}
          >
            Show Vote
          </button>
          <button
            className="rounded-md bg-amber-600 py-2 px-4 border border-transparent text-center text-sm text-slate-800 transition-all shadow-md hover:shadow-lg focus:bg-amber-700 focus:shadow-none active:bg-amber-700 hover:bg-amber-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 justify-self-center w-96 mb-2">
          <label className="block mb-2 text-sm text-slate-600">Voting</label>
          <div className="grid grid-cols-8 gap-2">
            <button
              className="rounded-md bg-blue-600 w-10 h-10 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              onClick={() => handleVote("1")}
            >
              1
            </button>
            <button
              className="rounded-md bg-blue-600 w-10 h-10 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              onClick={() => handleVote("2")}
            >
              2
            </button>
            <button
              className="rounded-md bg-blue-600 w-10 h-10 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              onClick={() => handleVote("3")}
            >
              3
            </button>
            <button
              className="rounded-md bg-blue-600 w-10 h-10 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              onClick={() => handleVote("4")}
            >
              4
            </button>
            <button
              className="rounded-md bg-blue-600 w-10 h-10 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              onClick={() => handleVote("5")}
            >
              5
            </button>
            <button
              className="rounded-md bg-blue-600 w-10 h-10 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              onClick={() => handleVote("6")}
            >
              6
            </button>
            <button
              className="rounded-md bg-blue-600 w-10 h-10 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              onClick={() => handleVote("7")}
            >
              7
            </button>
            <button
              className="rounded-md bg-blue-600 w-10 h-10 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              onClick={() => handleVote("8")}
            >
              8
            </button>
          </div>

          <hr className="mt-4" />
        </div>
        <div className="grid grid-cols-2 w-96 justify-self-center">
          <div>
            <ul>
              {users?.map((user) => (
                <li key={user?.id}>
                  {user?.name} vote:{" "}
                  {user.id === detail?.id || !user?.vote || isShowVote
                    ? user?.vote
                    : "*"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="justify-self-center lg:justify-self-start">
        <div className="grid grid-cols-1 w-96 justify-self-center">
          {resultVote ? (
            <div className="grid grid-flow-row">
              <label className="block mb-2 text-md text-slate-600">
                Result Vote
              </label>
              <ul className="border border-white rounded-md p-2">
                {Object.entries(resultVote).map(([key, value]) => (
                  <li key={key}>
                    vote: {key ? key : "ไม่มี vote"} = {value.length}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
}
