// ProfileHeader.tsx
interface UserInfo {
    avatarLink?: string;
    name?: string;
    email?: string;
}

interface ProfileHeaderProps {
    userInfo: UserInfo;
}

export const ProfileHeader = ({ userInfo }: ProfileHeaderProps) => (
    <div className="flex flex-col items-center mt-18 mb-2">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
            {userInfo?.avatarLink ? (
                <img src={userInfo.avatarLink} alt={userInfo?.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-main flex items-center justify-center"></div>
            )}
        </div>
        <div className="mt-3 text-xl font-bold">{userInfo?.name}</div>
        <div className="text-gray-400 text-sm">{userInfo?.email}</div>
    </div>
);