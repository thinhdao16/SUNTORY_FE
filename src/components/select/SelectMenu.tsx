import React from "react";
import { Controller, Control } from "react-hook-form";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { IoChevronDownOutline } from "react-icons/io5";

interface SelectMenuProps {
    name: string;
    control: Control<any>;
    label: string;
    options: { code: string; label: string }[];
    placeholder?: string;
    className?: string;
    required?: boolean;
    menuButtonClassName?: string; // thêm prop
    menuItemsClassName?: string;  // thêm prop
    labelClassName?: string; // thêm prop này
}

const SelectMenu: React.FC<SelectMenuProps> = ({
    name,
    control,
    label,
    options,
    placeholder = t("Select..."),
    className = "",
    required = false,
    menuButtonClassName = "",
    menuItemsClassName = "",
    labelClassName = "", // nhận prop này
}) => (
    <div className={`mb-2${className}`}>
        <div className={`font-medium mb-1 ${labelClassName}`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </div>
        <Controller
            name={name}
            control={control}
            rules={required ? { required: t("This field is required") } : undefined}
            render={({ field, fieldState }) => {
                const currentOption = options.find((o) => o.code === field.value);
                return (
                    <>
                        <Menu as="div" className="relative inline-block text-left w-full">
                            <MenuButton
                                className={`flex items-center justify-between w-full px-4 py-2 rounded-xl darkk:bg-dark-main border border-gray-400 darkk:border-gray-700 focus:border-main focus:border focus:outline-none darkk:text-white ${menuButtonClassName}`}
                            >
                                {currentOption ? currentOption.label : placeholder}
                                <IoChevronDownOutline />
                            </MenuButton>
                            <MenuItems
                                className={`absolute w-full right-0 z-10 mt-2 origin-top-right rounded-md bg-white darkk:bg-dark-extra shadow-lg ring-1 ring-black/5 focus:outline-hidden ${menuItemsClassName}`}
                            >
                                <div className="py-1">
                                    {options.map(({ code, label }) => (
                                        <MenuItem key={code}>
                                            {({ active }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(code)}
                                                    className={`block w-full text-left px-4 py-2 text-sm darkk:text-white ${active
                                                        ? "bg-gray-100 text-gray-900 darkk:bg-dark-main"
                                                        : "text-gray-700"
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            )}
                                        </MenuItem>
                                    ))}
                                </div>
                            </MenuItems>
                        </Menu>
                        {fieldState.error && (
                            <div className="text-red-500 text-xs mt-1">{fieldState.error.message}</div>
                        )}
                    </>
                );
            }}
        />
    </div>
);

export default SelectMenu;