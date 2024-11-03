"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { v7 } from "uuid";
import Loading from "@/components/loading";

interface UserDetail {
  id: string;
  name: string;
  vote: string;
}

interface ResultVote {
  vote: string;
  count: number;
  isMax: Boolean
}

export default function Rooms({ params }: { params: { roomId: string } }) {
  const [detail, setDetail] = useState<UserDetail>();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [point, setPoint] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isShowVote, setIsShowVote] = useState<boolean>(false);
  const [resultVote, setResultVote] = useState<ResultVote[]>();
  const [initMessage, setInitMessage] = useState<boolean>(false);
  const [isReConnect, setIsReConnect] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const socket = io("https://planning-poker-backend-7ii7.onrender.com");
  // const socket = io("http://localhost:3001");

  // const name = searchParams.get("name");
  const name = sessionStorage.getItem("name");
  const roomId = params.roomId;

  useEffect(() => {
    if (name) {
      const uuid = v7();
      setDetail({ id: uuid, name: name } as UserDetail);
      socket.emit("joinRoom", { roomId: roomId, id: uuid, name: name });
    } else {
      router.replace(`/joins/${roomId}`);
    }
  }, [name]);

  useEffect(() => {
    socket.off("connect");
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
      if (isReConnect) {
        location.reload();
      }
    });

    return () => {
      socket.off("connect");
    };
  }, [isReConnect]);

  useEffect(() => {
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsReConnect(true);
      setUsers([]);
    });

    socket.on("userDisconnect", (leaveUser: UserDetail) => {
      console.log("User Disconnected from server");
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id != leaveUser.id)
      );
    });

    socket.on("usersInRoom", (clientInfo: any) => {
      console.log("userInRomm Active");

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
      socket.off("disconnect");
      socket.off("voteResult");
      socket.off("messageResult");
      socket.off("clearResult");
      socket.off("showVoteResult");
      socket.off("summaryVoteResult");
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
      console.log(result, user);
      result[user.vote] = (result[user.vote] || 0) + 1;
      if (result[user.vote] > maxCount) {
        maxCount = result[user.vote];
      }
      return result;
    }, {} as any);

    const resultWithFlags: ResultVote[] = Object.entries(resultGroup).map(([key, value]) => ({
      vote: key,
      count: value,
      isMax: value === maxCount,
    }));

    console.log(resultWithFlags);

    socket?.emit("summaryVote", {
      roomId: roomId,
      userDetail: detail,
      resultVote: resultWithFlags,
    });
  };

  return (
    <>
      {isReConnect || !isConnected ? (
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
                  <hr className="block lg:hidden mb-2" />
                  <label className="block mb-2 text-md text-slate-600">
                    Result Vote
                  </label>
                  <ul className="border border-white rounded-md p-2">
                    {resultVote.map((value) => (
                      <li key={value.vote}>
                        {value.vote ? value.vote : <span className="text-yellow-700">ไม่ vote</span>} = <span className={value.isMax ? "text-green-600 font-bold" : ""}>{value.count}</span>
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
