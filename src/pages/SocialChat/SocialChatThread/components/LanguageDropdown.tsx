import React, { useRef, useEffect } from "react";
import VectorUpIcon from "@/icons/logo/social-chat/vector-up.svg?react";
import { Language } from "@/store/zustand/language-store";
import LanguageMore from "@/icons/logo/social-chat/language-more.svg?react";
interface LanguageDropdownProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    selected: Language;
    setSelected: (v: Language) => void;
    languagesSocialChat: Language[];
    openModalTranslate: () => void;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
    open,
    setOpen,
    selected,
    setSelected,
    languagesSocialChat,
    openModalTranslate
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [setOpen]);

    return (
        <div ref={containerRef} className="relative inline-block text-left bg-success-500 px-3 py-1 rounded-xl" onClick={() => setOpen(!open)}>
            <div className="flex" >
                <button type="button" className={`flex items-center focus:outline-none font-semibold text-sm  ${selected.code && ' uppercase'}`}>
                    {selected.code ?? 'Auto'}
                </button>
                <button>
                    <VectorUpIcon className={`${open ? 'transform rotate-180' : ''}`} />
                </button>
            </div>
            {open && (
                <div className="absolute bottom-full mb-2 left-0  w-[72px] grid font-bold bg-neutral-50 rounded-xl shadow-[0px_2px_4px_2px_#0000001A] overflow-hidden ">
                    {languagesSocialChat
                        .filter(lang =>
                            lang.code === 'en' ||
                            lang.code === 'vi' ||
                            lang.code === selected.code
                        )
                        .sort((a, b) => {
                            if (a.code === null) return 1;
                            if (b.code === null) return -1;
                            return 0;
                        })
                        .map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => { setSelected(lang); setOpen(false); }}
                                className={`text-center ${lang.code && 'uppercase'} p-3 ${lang.code === selected.code ? 'bg-gray-100 text-main' : 'hover:bg-gray-50 '} `}
                            >
                                {lang.code }
                            </button>
                        ))}
                    <button
                        onClick={openModalTranslate}
                        className={`flex items-center justify-center p-3   `}
                    >
                        <LanguageMore />
                    </button>
                    {/* <button
                        onClick={() => setOpen(false)}
                        className="text-center p-3 "
                    >
                        Cancel
                    </button> */}
                </div>
            )}
        </div>
    );
};

export default LanguageDropdown;