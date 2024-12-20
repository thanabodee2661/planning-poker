"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { v7 } from "uuid";
import Loading from "@/components/loading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';

interface UserDetail {
  id: string;
  name: string;
  vote: string;
}

interface ResultVote {
  vote: string;
  count: number;
  isMax: Boolean;
}

let socket: Socket;

export default function Rooms({ params }: { params: { roomId: string } }) {
  const [detail, setDetail] = useState<UserDetail>();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [point, setPoint] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isShowVote, setIsShowVote] = useState<boolean>(false);
  const [resultVote, setResultVote] = useState<ResultVote[]>();
  const [initMessage, setInitMessage] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [name, setName] = useState<string>("");

  const router = useRouter();
  const roomId = params.roomId;

  useEffect(() => {
    if (socket) {
      if (name) {
        const uuid = v7();
        setDetail({ id: uuid, name: name } as UserDetail);
        socket?.emit("joinRoom", { roomId: roomId, id: uuid, name: name });
      } else {
        router.replace(`/joins/${roomId}`);
      }
    }
  }, [name]);

  useEffect(() => {
    socket = io("https://planning-poker-backend-7ii7.onrender.com");

    socket?.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
      setName(sessionStorage.getItem("name") || "");
    });

    socket?.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
      setUsers([]);
      setName("");
    });

    socket?.on("userDisconnect", (leaveUser: UserDetail) => {
      console.log("User Disconnected from server");
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id != leaveUser.id)
      );
    });

    socket?.on("usersInRoom", (clientInfo: any) => {
      console.log("userInRomm Active");

      const userList = clientInfo.clients.map((c: any) => {
        if (c.userDetail) {
          return c.userDetail;
        }
      });
      setUsers(userList);
    });

    socket?.on("voteResult", (data: any) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === data.userDetail.id ? { ...user, vote: data.vote } : user
        )
      );
    });

    socket?.on("messageResult", (message) => {
      setMessage(message);
    });

    socket?.on("clearResult", () => {
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

    socket?.on("showVoteResult", () => {
      setIsShowVote(true);
    });

    socket?.on("summaryVoteResult", (resultVote) => {
      setResultVote(resultVote);
    });

    return () => {
      socket?.off("usersInRoom");
      socket?.off("disconnect");
      socket?.off("voteResult");
      socket?.off("messageResult");
      socket?.off("clearResult");
      socket?.off("showVoteResult");
      socket?.off("summaryVoteResult");
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isShowVote) {
      summarize();
    }
  }, [users]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (initMessage) {
      timeout = setTimeout(() => {
        socket?.emit("message", {
          roomId: roomId,
          userDetail: detail,
          message: message,
        });
      }, 500);
    }

    setInitMessage(true);
    return () => {
      clearTimeout(timeout);
    };
  }, [message]);

  const handleVote = async (value: string) => {
    setPoint(value);
    setUsers((prevUsers) => {
      return prevUsers.map((user) =>
        user.id === detail?.id ? { ...user, vote: value } : user
      );
    });

    socket?.emit("vote", { roomId: roomId, userDetail: detail, vote: value });
  };

  const handleClear = () => {
    socket?.emit("clear", { roomId: roomId, userDetail: detail });
  };

  const handleMessage = (e: any) => {
    setMessage(e.target.value);
  };

  const handleShowVote = async () => {
    await summarize();
    socket?.emit("showVote", {
      roomId: roomId,
      userDetail: detail,
    });
  };

  const summarize = async () => {
    let maxCount = 0;
    const resultGroup: Object = users.reduce((result, user) => {
      result[user.vote] = (result[user.vote] || 0) + 1;
      if (result[user.vote] > maxCount) {
        maxCount = result[user.vote];
      }
      return result;
    }, {} as any);

    const resultWithFlags: ResultVote[] = Object.entries(resultGroup).map(
      ([key, value]) => ({
        vote: key,
        count: value,
        isMax: value === maxCount,
      })
    );

    socket?.emit("summaryVote", {
      roomId: roomId,
      userDetail: detail,
      resultVote: resultWithFlags,
    });
  };

  return (
    <>
      {!isConnected ? (
        <Loading message="กำลังเชื่อมต่อ Server กรุณารอสักครู่"></Loading>
      ) : (
        <div className="grid grid-cols-1 mt-10 mx-10 gap-2 lg:grid-cols-2">
          <div className="justify-self-center lg:justify-self-end">
            <div className="grid grid-cols-1 justify-self-center w-96 mb-2">
              <label className="block mb-2 text-md text-slate-600">
                Room ID: {params.roomId}
              </label>

              <div className="relative w-full">
                <textarea
                  className="peer h-full min-h-[100px] w-full resize-none rounded-[7px] border bg-transparent px-3 py-2.5 font-sans text-sm font-normal outline outline-0 transition-all shadow-md focus:shadow-lg"
                  placeholder="Topic"
                  value={message}
                  onChange={handleMessage}
                ></textarea>
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
              <label className="block mb-2 text-sm text-slate-600">
                Voting
              </label>
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
            </div>
            <div className="grid grid-cols-1 w-96 justify-self-center">
              Player
              <hr className="my-2" />
              {users?.map((user) => (
                <div className="flex flex-row gap-2" key={user?.id}>
                  {user?.vote ? (<div className="w-6 text-green-500"><FontAwesomeIcon icon={faCircleCheck} /></div>) : ""}
                  <div className="flex-1">{user?.name}</div>
                  <div className="w-12 text-end">
                    {user.id === detail?.id || !user?.vote || isShowVote
                      ? user?.vote
                      : "*****"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="justify-self-center lg:justify-self-start mb-2">
            <div className="grid grid-cols-1 w-96 justify-self-center">
              {resultVote ? (
                <div className="grid grid-flow-row">
                  <hr className="block lg:hidden mb-2" />
                  <label className="block mb-2 text-md text-slate-600">
                    Result Vote
                  </label>
                  <ul className="border rounded-md p-2">
                    {resultVote.map((value) => (
                      <li key={value.vote}>
                        {value.vote ? (
                          value.vote
                        ) : (
                          <span className="text-yellow-700">ไม่ vote</span>
                        )}{" "}
                        ={" "}
                        <span
                          className={
                            value.isMax ? "text-green-600 font-bold" : ""
                          }
                        >
                          {value.count}
                        </span>
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
      )}
    </>
  );
}
