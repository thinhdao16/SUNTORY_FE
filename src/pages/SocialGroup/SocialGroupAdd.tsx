import { useState, useEffect, useRef } from "react";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { useHistory } from "react-router";
import { useFriendshipFriends } from "../SocialPartner/hooks/useSocialPartner";
import SendIcon from "@/icons/logo/social-chat/send.svg?react";
import SendEmptyIcon from "@/icons/logo/social-chat/send-empty.svg?react";
import CheckboxSelectIcon from "@/icons/logo/checkbox-select.svg?react";
import { useCreateChatGroup } from "./hooks/useSocialGroup";
import { Capacitor } from "@capacitor/core";
import SearchIcon from '@/icons/logo/social-chat/search.svg?react';
import ClearInputIcon from '@/icons/logo/social-chat/clear-input.svg?react';

function SocialGroupAdd() {
  const isNative = Capacitor.isNativePlatform();

  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const history = useHistory();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useFriendshipFriends(20);
  const { mutate: createGroup, isLoading: creating } = useCreateChatGroup(history);
  const users = data?.pages.flat() ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter((user) =>
    user.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const removeSelected = (id: number) => {
    setSelectedUsers((prev) => prev.filter((uid) => uid !== id));
  };
  const handleCreateGroup = () => {
    if (selectedUsers.length === 0) return;

    createGroup(
      {
        title: groupName || "New Group",
        userIds: selectedUsers,
      },

    );
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="bg-white min-h-screen  py-3">
      <div className="px-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => history.goBack()} className="text-gray-500">
            <FiArrowLeft className="text-xl" />
          </button>
          <h2 className="text-blue-600 font-semibold">ADD GROUP</h2>
          <button onClick={handleCreateGroup} disabled={creating}>
            {selectedUsers.length > 0 ? <SendIcon /> : <SendEmptyIcon />}
          </button>

        </div>

        {selectedUsers.length > 0 && (
          <div className="flex gap-[15px] mb-3  overflow-x-auto w-full">
            {selectedUsers.map((id) => {
              const user = users.find((u) => u.id === id);
              return (
                <div key={id} className="relative text-center">
                  <img
                    src={user.avatar || '/favicon.png'}
                    alt={user.fullName}
                    className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-2xl object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = '/favicon.png';
                    }}
                  />

                  <button
                    onClick={() => removeSelected(id)}
                    className="absolute -top-1 -right-1 bg-success-500 text-black rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <HiX className="text-[14px]" />
                  </button>
                  <p className="text-xs text-center max-w-[50px] truncate">{user?.fullName}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="">
          <input
            type="text"
            placeholder="Group name (optional)"
            className="w-full border-none text-netural-300 outline-none"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div className="flex items-center bg-chat-to rounded-lg px-4 py-2 ">
          <SearchIcon className="text-gray-400 mr-2" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search"
            className="flex-grow bg-transparent text-sm focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <ClearInputIcon
              onClick={() => {
                setSearch("");
                inputRef.current?.blur();
              }}
            />
          )}

        </div>
      </div>

      <div className={`px-6 mt-4 overflow-y-auto pb-28 ${isNative
        ? "max-h-[75vh]"
        : "max-h-[65vh] lg:max-h-[65vh] xl:max-h-[75vh]"
        }`}>
        {filteredUsers.length > 0 && (
          <h3 className="text-sm text-netural-500 mb-4">{t("Suggestion")}</h3>
        )}

        <div ref={scrollRef} className={`space-y-3  `}>
          {isLoading ? (
            <p className="text-center text-gray-400">Loading...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center text-center text-gray-500 mt-20">
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-xl mb-3">
                <FiSearch />
              </div>
              <p>No relevant search results found.</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between  pb-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`checkbox-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="peer hidden"
                  />
                  <label
                    htmlFor={`checkbox-${user.id}`}
                    className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center cursor-pointer
    ${selectedUsers.includes(user.id)
                        ? "bg-main border-main"
                        : "border-neutral-300 bg-white"}
  `}
                  >
                    {selectedUsers.includes(user.id) && (
                      <CheckboxSelectIcon />
                    )}
                  </label>
                  <img
                    src={user.avatar || '/favicon.png'}
                    alt={user.fullName}
                    className="w-[50px] h-[50px] rounded-2xl object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/favicon.png';
                    }}
                  />
                  <div className="">
                    <span className=" font-medium">{user.fullName}</span>
                  </div>
                </div>
              </div>
            ))
          )}
          {isFetchingNextPage && (
            <p className="text-center text-gray-400 text-sm">Loading more...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialGroupAdd;