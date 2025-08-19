import { useNotificationStore } from "@/store/zustand/notify-store";
import { motion, AnimatePresence } from "framer-motion";

export const NotificationList = () => {
    const { notifications, markAsRead } = useNotificationStore();
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-80">
            <AnimatePresence>
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white shadow-lg rounded-xl p-3 flex gap-3 items-center"
                        onClick={() => markAsRead(n.id)}
                    >
                        {n.avatar && (
                            <img
                                src={n.avatar}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        )}
                        <div className="flex-1">
                            <p className="font-semibold">{n.title}</p>
                            <p className="text-sm text-gray-500">{n.body}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
