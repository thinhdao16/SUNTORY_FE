import React, { useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useChatRoomByCode, useCreateAnonymousChat, useRemoveGroupMembers, useLeaveChatRoom, useTransferAdmin } from '../hooks/useSocialChat';
import { useToastStore } from '@/store/zustand/toast-store';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import "../SocialChat.css"
import MotionStyles from '@/components/common/bottomSheet/MotionStyles';
import MotionBottomSheet from '@/components/common/bottomSheet/MotionBottomSheet';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import ActionMember from '@/pages/SocialChat/SocialChatInfo/components/ActionMember';
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { useAuthStore } from '@/store/zustand/auth-store';
import { t } from "@/lib/globalT";
import ConfirmModal from '@/components/common/modals/ConfirmModal';
import BackDefaultIcon from "@/icons/logo/back-default.svg?react";
import { TbLogout } from 'react-icons/tb';
import ActionButton from '@/components/loading/ActionButton';
import { useSocialSignalR } from '@/hooks/useSocialSignalR';
import { useUserActivity } from '@/hooks/useUserActivity';
import useDeviceInfo from '@/hooks/useDeviceInfo';

const SocialChatMembers: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const history = useHistory();
    const { refetch } = useChatRoomByCode(roomId);
    const { roomChatInfo, setRoomChatInfo } = useSocialChatStore();
    const { user } = useAuthStore();
    const showToast = useToastStore((state) => state.showToast);

    const sheetExpand = useBottomSheet();

    const [selectedMember, setSelectedMember] = useState<any>(null);

    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<{ id: number, name: string } | null>(null);

    const [actionLoading, setActionLoading] = useState<{ type?: 'remove' | 'appoint' | 'leave', userId?: number } | null>(null);

    const currentUserIsAdmin = roomChatInfo?.participants?.find(
        (p) => p.userId === user?.id && p.isAdmin === 1
    ) || false;

    const isAdmin = React.useMemo(() => {
        if (!user || !roomChatInfo?.participants) return false;
        const currentUserParticipant = roomChatInfo.participants.find(
            (p) => p.userId === user.id
        );
        return currentUserParticipant?.isAdmin === 1;
    }, [user, roomChatInfo]);

    const { mutateAsync: removeMemberAsync, isLoading: removing } = useRemoveGroupMembers({
        onSuccess: () => {
            refetch();
            showToast(t("Member removed successfully"), 2000, "success");
        }
    });

    const { mutateAsync: leaveRoom, isLoading: isLeaving } = useLeaveChatRoom({
        onSuccess: () => {
            history.push('/social-chat');
        }
    });
    const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
    const { mutateAsync: createAnonymousChat } = useCreateAnonymousChat();
    const { mutateAsync: transferAdmin, isLoading: isTransferring } = useTransferAdmin({
        onSuccess: () => {
            refetch();
            showToast(t("Admin transferred successfully"), 2000, "success");
        },
        onError: () => {
        }
    });
    const [isAppointConfirmOpen, setIsAppointConfirmOpen] = useState(false);
    const [memberToAppoint, setMemberToAppoint] = useState<any | null>(null);

    const handleLeaveGroup = async () => {
        if (!roomId) return;
        try {
            setActionLoading({ type: 'leave' });
            await leaveRoom({ chatCode: roomId });
        } catch (error) {
            console.error('Leave group failed', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBack = () => {
        history.push(`/social-chat/t/${roomId}/info`);
    };

    const handleUserAction = (member: any) => {
        setSelectedMember(member);
        sheetExpand.open();
    };


    const handleRemoveFromGroup = (userId: number) => {
        if (!roomId || !userId) return;

        if (userId === user?.id) {
            showToast(t("You cannot remove yourself from the group"), 3000, "error");
            return;
        }
        const member = roomChatInfo?.participants?.find(p => p.userId === userId);
        if (member) {
            setMemberToRemove({
                id: userId,
                name: member.user?.fullName || t("This user")
            });
            setIsRemoveModalOpen(true);
        }
        sheetExpand.close();
    };

    const confirmRemoveMember = async () => {
        if (!roomId || !memberToRemove) return;
        try {
            setActionLoading({ type: 'remove', userId: memberToRemove.id });
            await removeMemberAsync({
                chatCode: roomId,
                userIds: [memberToRemove.id]
            });
            setIsRemoveModalOpen(false);
            setMemberToRemove(null);
        } catch (err) {
            console.error('Remove member failed', err);
        } finally {
            setActionLoading(null);
        }
    };
    const handleViewProfile = (userId: number) => {
        history.push(`/profile/${userId}`);
        sheetExpand.close();
    };

    const handleSendMessage = async (user: any) => {
        sheetExpand.close();
        setRoomChatInfo({
            id: 0,
            code: "",
            title: user?.fullName || "Anonymous",
            avatarRoomChat: user?.avatar || "/favicon.png",
            type: 0,
            status: 0,
            createDate: new Date().toISOString(),
            updateDate: new Date().toISOString(),
            unreadCount: 0,
            lastMessageInfo: null,
            participants: [],
            topic: null,
            chatInfo: null,
        });
        history.push(`/social-chat/t`);
        const chatData = await createAnonymousChat(user.id);
        if (chatData?.chatCode) {
            history.replace(`/social-chat/t/${chatData.chatCode}`);
        }
    };

    const handleAppointAdmin = (userId: number) => {
        const member = roomChatInfo?.participants?.find(p => p.userId === userId);
        if (!member) {
            showToast(t("User not found"), 2000, "error");
            sheetExpand.close();
            return;
        }
        setMemberToAppoint(member);
        setIsAppointConfirmOpen(true);
        sheetExpand.close();
    };

    const confirmAppointAdmin = async () => {
        if (!roomId || !memberToAppoint) return;
        try {
            setActionLoading({ type: 'appoint', userId: memberToAppoint.userId });
            await transferAdmin({ chatCode: roomId, newAdminUserId: memberToAppoint.userId });
            setIsAppointConfirmOpen(false);
        } catch (err) {
            console.error("Transfer admin failed", err);
        } finally {
            setMemberToAppoint(null);
            setActionLoading(null);
        }
    };
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();

    const { activity } = useSocialSignalR(deviceInfo.deviceId ?? "", {
        roomId: roomId ?? "",
        autoConnect: true,
        enableDebugLogs: false,
        onTypingUsers: (payload) => {
        }
    });
    useUserActivity(activity, { enabled: !!roomId });
    return (
        <>
            <MotionStyles
                isOpen={sheetExpand.isOpen}
                translateY={sheetExpand.translateY}
                screenHeight={window.innerHeight}
            >
                {({ scale, opacity, borderRadius, backgroundColor }) => (
                    <div
                        className={` ${sheetExpand.isOpen ? "" : "bg-blue-100"}`}
                        style={{
                            backgroundColor: backgroundColor,
                            transition: sheetExpand.isOpen ? "none" : "background-color 0.3s ease",
                        }}
                    >
                        <MotionBottomSheet
                            isOpen={sheetExpand.isOpen}
                            scale={scale}
                            opacity={opacity}
                            borderRadius={borderRadius}
                        >
                            <div className="h-screen flex flex-col">
                                <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between bg-white">
                                    <div className="flex items-center">
                                        <button onClick={handleBack} className="p-1">
                                            <BackDefaultIcon className="text-xl" />
                                        </button>
                                        <h1 className="text-base font-semibold ml-2">{t("Members")}</h1>
                                    </div>
                                    {/* {currentUserIsAdmin && (
                                        <button className="p-1" onClick={handleAddMembers}>
                                            <IoAdd className="text-xl" />
                                        </button>
                                    )} */}
                                </div>
                                <div className="px-4 py-2 text-gray-500 text-sm">
                                    {roomChatInfo?.participants?.length || 0} {t("members")}
                                </div>
                                <div className="flex-1 overflow-y-auto px-4 pb-6">
                                    <div className="bg-white rounded-xl overflow-hidden">
                                        {roomChatInfo?.participants?.map((member) => (
                                            <div key={member.userId} className="flex items-center justify-between  py-3 border-b border-gray-100 last:border-b-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden">
                                                        <img
                                                            src={member?.user?.avatar || avatarFallback}
                                                            alt={member?.user?.fullName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = avatarFallback;
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium flex items-end justify-start gap-1 ">
                                                            <span> {member?.user?.fullName}</span>
                                                            <span className='text-xs text-netural-200'>{member?.user?.id === user?.id ? t('(You)') : ''}</span>
                                                            {/* {actionLoading?.userId === member.userId && (
                                                                <span className="ml-2">
                                                                    <svg className="animate-spin w-4 h-4 text-gray-500 inline-block" viewBox="0 0 24 24" fill="none" aria-hidden>
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                                                    </svg>
                                                                </span>
                                                            )} */}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {member.isAdmin ? t('Admin') : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ActionButton
                                                    ariaLabel="member-actions"
                                                    onClick={() => handleUserAction(member)}
                                                    disabled={!!actionLoading}
                                                    loading={actionLoading?.userId === member.userId}
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                        <circle cx="12" cy="12" r="1"></circle>
                                                        <circle cx="12" cy="5" r="1"></circle>
                                                        <circle cx="12" cy="19" r="1"></circle>
                                                    </svg>
                                                </ActionButton>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </MotionBottomSheet>
                        <ActionMember
                            isOpen={sheetExpand.isOpen}
                            translateY={sheetExpand.translateY}
                            closeModal={sheetExpand.close}
                            handleTouchStart={sheetExpand.handleTouchStart}
                            handleTouchMove={sheetExpand.handleTouchMove}
                            handleTouchEnd={sheetExpand.handleTouchEnd}
                            selectedUser={selectedMember}
                            onViewProfile={handleViewProfile}
                            onSendMessage={handleSendMessage}
                            onAppointAdmin={currentUserIsAdmin ? handleAppointAdmin : undefined}
                            onRemoveFromGroup={currentUserIsAdmin ? handleRemoveFromGroup : undefined}
                            onLeaveGroup={() => setIsLeaveConfirmOpen(true)}
                            isAdmin={isAdmin}
                            isUser={selectedMember?.userId === user?.id}
                        />
                    </div>
                )}
            </MotionStyles>

            <div className="px-4 pb-6">
                <ActionButton
                    variant="danger"
                    size="md"
                    onClick={() => setIsLeaveConfirmOpen(true)}
                    loading={actionLoading?.type === 'leave' || isLeaving}
                >
                    <TbLogout className="text-xl" />
                    <span className="ml-2">{(actionLoading?.type === 'leave' || isLeaving) ? t('Leaving...') : t('Leave group')}</span>
                </ActionButton>
            </div>

            <ConfirmModal
                isOpen={isRemoveModalOpen}
                title={t("Are you sure?")}
                message={t("This user will no longer have access to the chat.")}
                confirmText={t("Yes, remove")}
                cancelText={t("Cancel")}
                onConfirm={confirmRemoveMember}
                onClose={() => { if (!actionLoading) setIsRemoveModalOpen(false); }}
            />

            <ConfirmModal
                isOpen={isAppointConfirmOpen}
                title={t("Transfer admin?")}
                message={memberToAppoint ? t("Are you sure you want to make {{name}} an admin?", { name: memberToAppoint.user?.fullName || '' }) : t("Are you sure?")}
                confirmText={t("Transfer")}
                cancelText={t("Cancel")}
                onConfirm={confirmAppointAdmin}
                onClose={() => { if (!actionLoading) { setIsAppointConfirmOpen(false); setMemberToAppoint(null); } }}
            />

            <ConfirmModal
                isOpen={isLeaveConfirmOpen}
                title={t("Are you sure?")}
                message={t("Are you sure you want to leave this group?")}
                confirmText={t("Leave")}
                cancelText={t("Cancel")}
                onConfirm={() => {
                    void handleLeaveGroup();
                }}
                onClose={() => setIsLeaveConfirmOpen(false)}
            />
        </>
    );
};

export default SocialChatMembers;