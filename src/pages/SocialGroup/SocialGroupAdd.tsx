import { useState, useEffect, useRef } from "react";
import {FiSearch } from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { useHistory } from "react-router";
import { useFriendshipFriendsWithSearch } from "../SocialPartner/hooks/useSocialPartner";
import SendIcon from "@/icons/logo/social-chat/send.svg?react";
import SendEmptyIcon from "@/icons/logo/social-chat/send-empty.svg?react";
import CheckboxSelectIcon from "@/icons/logo/checkbox-select.svg?react";
import { useCreateChatGroup } from "./hooks/useSocialGroup";
import { Capacitor } from "@capacitor/core";
import SearchIcon from '@/icons/logo/social-chat/search.svg?react';
import ClearInputIcon from '@/icons/logo/social-chat/clear-input.svg?react';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { t } from "@/lib/globalT";
import { useDebounce } from "@/hooks/useDebounce";
import ActionButton from "@/components/loading/ActionButton";
import BackIcon from "@/icons/logo/back-default.svg?react";

function SocialGroupAdd( { isProfile }: { isProfile?: boolean } ) {
  const isNative = Capacitor.isNativePlatform();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedUsersData, setSelectedUsersData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const history = useHistory();

  const debouncedSearch = useDebounce(search, 500); 

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useFriendshipFriendsWithSearch(20, debouncedSearch);

  const { mutate: createGroup, isLoading: creating } = useCreateChatGroup(history);
  const users = data?.pages.flat() ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayUsers = users;

  useEffect(() => {
    if (debouncedSearch) {
      // setSelectedUsers([]); 
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedSearch !== search) {
    }
  }, [debouncedSearch, search]);

  const toggleUser = (id: number) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    setSelectedUsers((prev) => {
      if (prev.includes(id)) {
        setSelectedUsersData(prevData => prevData.filter(u => u.id !== id));
        return prev.filter((uid) => uid !== id);
      } else {
        setSelectedUsersData(prevData => [...prevData, user]);
        return [...prev, id];
      }
    });
  };

  const removeSelected = (id: number) => {
    setSelectedUsers((prev) => prev.filter((uid) => uid !== id));
    setSelectedUsersData(prevData => prevData.filter(u => u.id !== id));
  };
  const handleCreateGroup = () => {
    if (selectedUsers.length === 0) return;

    const trimmedName = (groupName || "").trim();
    const selectedNames = selectedUsersData
      .map((user) => user?.fullName)
      .filter(Boolean) as string[];
    const namesTitle = selectedNames.join(", ");
    const title =
      trimmedName ||
      (namesTitle ? (namesTitle.length > 60 ? namesTitle.slice(0, 57) + "..." : namesTitle) : "New Group");

    createGroup({
      title,
      userIds: selectedUsers,
    });
  };

  const handleClearSearch = () => {
    setSearch("");
    inputRef.current?.blur();
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
      <div className="px-4 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => history.goBack()} className="text-gray-500">
            <BackIcon  />
          </button>
          <h2 className="font-semibold uppercase">  {t("Add Group")}</h2>
          <ActionButton
            onClick={handleCreateGroup}
            disabled={selectedUsers.length === 0}
            loading={creating}
            variant={"ghost"}
            size="none"
            ariaLabel="create-group"
          >
            {creating ? "" : (selectedUsers.length > 0 ? <SendIcon /> : <SendEmptyIcon />)}
          </ActionButton>
        </div>
        {selectedUsers.length > 0 && (
          <div className="flex gap-[15px] mb-3  overflow-x-auto w-full pt-2">
            {selectedUsersData.map((user) => (
              <div key={user.id} className="relative z-9 text-center flex flex-col gap-1 items-center justify-center">
                <img
                  src={user?.avatar || avatarFallback}
                  alt={user?.fullName}
                  className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-2xl object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = avatarFallback;
                  }}
                />
                <button
                  onClick={() => removeSelected(user.id)}
                  className="absolute z-20 -top-1 -right-1"
                >
                  <div className=" bg-success-500 text-black rounded-full w-5 h-5 flex items-center justify-center">
                  <HiX className="text-[14px]" />
                  
                  </div>
                </button>
                <p className="text-xs text-center max-w-[40px] truncate">{user?.fullName}</p>
              </div>
            ))}
          </div>
        )}
        <div className="">
          <input
            type="text"
            placeholder={t("Group name (optional)")}
            className="w-full border-none text-netural-300 outline-none"
            value={groupName}
            onChange={(e) => setGroupName(e?.target?.value)}
            disabled={creating}
          />
        </div>
        <div className="flex items-center bg-chat-to rounded-lg px-4 py-2 ">
          <SearchIcon className="text-gray-400 mr-2" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t("Search")}
            className="flex-grow bg-transparent text-sm focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={creating}
          />
          {search && (
            <ClearInputIcon
              onClick={handleClearSearch}
              className="cursor-pointer"
            />
          )}
        </div>
        {search && debouncedSearch !== search && (
          <div className="text-sm text-gray-500 text-center">
            {t("Searching...")}
          </div>
        )}
      </div>
      <div className={`px-4 mt-4 overflow-y-auto pb-36 ${isNative
        ? "max-h-[85vh]"
        : " max-h-[75vh]"
        }`}>
        {displayUsers.length > 0 && !search && (
          <h3 className="text-sm text-netural-500 mb-4">
            {t("Suggestion")}
          </h3>
        )}

        {search && displayUsers.length > 0 && (
          <h3 className="text-sm text-netural-500 mb-4">
            {t("Search Results")} ({displayUsers.length})
          </h3>
        )}

        <div ref={scrollRef} className="space-y-3">
          {isLoading ? (
            <p className="text-center text-gray-400">{t("Loading...")}</p>
          ) : displayUsers.length === 0 ? (
            <div className="flex flex-col items-center text-center text-gray-500 mt-20">
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-xl mb-3">
                <FiSearch />
              </div>
              <p>
                {search 
                  ? t("No relevant search results found.")
                  : t("No friends found.")
                }
              </p>
            </div>
          ) : (
            displayUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between  pb-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`checkbox-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="peer hidden"
                    disabled={creating}
                  />
                  <label
                    htmlFor={`checkbox-${user.id}`}
                    className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center cursor-pointer
                    ${selectedUsers.includes(user.id) ? "bg-main border-main" : "border-neutral-300 bg-white"}`}>
                    {selectedUsers.includes(user.id) && (
                      <CheckboxSelectIcon />
                    )}
                  </label>
                  <img
                    src={user.avatar || avatarFallback}
                    alt={user.fullName}
                    className="w-[50px] h-[50px] rounded-2xl object-cover"
                    onError={(e) => {
                      e.currentTarget.src = avatarFallback;
                    }}
                  />
                  <div className=" max-w-[250px] truncate">
                    <span className=" font-medium">{user.fullName}</span>
                  </div>
                </div>
              </div>
            ))
          )}
          {isFetchingNextPage && (
            <p className="text-center text-gray-400 text-sm">{t("Loading more...")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialGroupAdd;