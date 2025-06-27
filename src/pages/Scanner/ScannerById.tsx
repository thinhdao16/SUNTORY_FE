/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IonContent, IonFooter, IonPage, IonSpinner, IonToolbar } from "@ionic/react";
import { useParams, RouteComponentProps, useHistory } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import "./Scanner.module.css";

import {
  handleTouchStart as handleTouchStartUtil,
  handleTouchMove as handleTouchMoveUtil,
  handleTouchEnd as handleTouchEndUtil,
} from "@/utils/translate-utils";
import { IoChevronDownOutline, IoCloseOutline } from "react-icons/io5";

import { PiDivideFill, PiDivideLight } from "react-icons/pi";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import MotionBottomSheet from "@/components/common/bottomSheet/MotionBottomSheet";
import MotionStyles from "@/components/common/bottomSheet/MotionStyles";
import SelectModal from "@/components/common/bottomSheet/SelectModal";
import { handleCopyToClipboard } from "@/components/common/HandleCoppy";
import TakePhoto from "@/components/take-photo/TakePhoto";
import { languages } from "@/constants/languageLocale";
import { useScannerStore } from "@/store/zustand/scanner-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { handleImageError } from "@/utils/image-utils";
interface ScannerByIdParams {
  id: string;
}
const velocityThreshold = 0.4;

const ScannerById: React.FC<RouteComponentProps> = () => {
  const { id } = useParams<ScannerByIdParams>();

  const startY = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const screenHeight = useRef(window.innerHeight);
  const history = useHistory();
  const deviceInfo = useDeviceInfo();
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);


  const {
    fetchScannerById,
    checkQrScan,
    results: dataProduct,
    resultStore: dataStore,
    isLoadingProduct: loading,
    note,
    setNote,
    selectedProducts,
    toggleProductSelection,
    submitScannerFeedback,
    isLoading,
    selectedLang,
    setSelectedLang,
  } = useScannerStore() as any;


  const openModal = () => {
    setIsOpen(true);
    setTranslateY(0);
  };

  const closeModal = () => {
    setTranslateY(screenHeight.current);
    setTimeout(() => {
      setIsOpen(false);
      setTranslateY(0);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleTouchStartUtil(e, startY, startTime);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleTouchMoveUtil(e, startY, screenHeight, setTranslateY);
  };

  const handleTouchEnd = () => {
    handleTouchEndUtil(
      translateY,
      startY,
      startTime,
      screenHeight,
      velocityThreshold,
      closeModal,
      setTranslateY
    );
  };

  const onSelectProduct = (product: { id: number; name: string }) => {
    toggleProductSelection(product);
  };
  const dataRate = useMemo(
    () => ({
      productIds: selectedProducts.map((p: { id: number }) => p.id) || [],
      storeId: dataStore?.id || "unknown",
      deviceId: deviceInfo.deviceId || "unknown",
      rating: 5,
      qrCode: id || "qr",
      userNote: note || "note",
      systemLanguage: selectedLang || "en",
    }),
    [
      selectedProducts,
      dataStore?.id,
      deviceInfo.deviceId,
      selectedLang,
      id,
      note,
    ]
  );

  const handleGenerate = async () => {
    try {
      await submitScannerFeedback(dataRate);
      const updatedResultReview: any = useScannerStore.getState().resultReview;
      if (!updatedResultReview || updatedResultReview.length === 0) {
        throw new Error("No review data available.");
      }
      handleCopyToClipboard(updatedResultReview.review || "");
      setTimeout(() => {
        history.push(`/rate`);
      }, 1000);
    } catch (error: any) {
      const showToast = useToastStore.getState().showToast;
      showToast(
        error.message || "Failed to submit feedback. Please try again.",
        3000
      );
    }
  };

  const handleInputSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      setSearchLoading(true);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(async () => {
        await fetchScannerById(id, value);
        setSearchLoading(false);
      }, 1000);
    },
    [id]
  );

  const currentLangLabel =
    languages.find((lang) => lang.code === selectedLang)?.label || 'Language';

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchScannerById(id);
        const resultStore = useScannerStore.getState().resultStore;
        if (!resultStore) {
          const showToast = useToastStore.getState().showToast;
          showToast("Store data is missing. Redirecting...", 3000);
          history.push("/scanner");
        }
      } catch (error: any) {
        const showToast = useToastStore.getState().showToast;
        showToast(
          error.message || "Failed to fetch scanner data. Redirecting...",
          3000
        );
        history.push("/scanner");
      }
    };
    const checkScanQr = sessionStorage.getItem("check_scan");
    if (checkScanQr === "no" && deviceInfo.deviceId) {
      checkQrScan(id, deviceInfo.deviceId)
      sessionStorage.setItem("check_scan", "yes");

    }
    fetchData();
    if (!selectedLang) {
      setSelectedLang(deviceInfo.language);
    }
  }, [id, history, deviceInfo.deviceId]);

  return (
    <>
      <MotionStyles
        isOpen={isOpen}
        translateY={translateY}
        screenHeight={screenHeight.current}
      >
        {({ opacity, borderRadius, backgroundColor }) => (
          <IonPage>
            <IonContent fullscreen scrollY={true} >
              <div
                className={`darkk:bg-gray-700 relative ${isOpen ? "" : "bg-blue-100"}`}
                style={{
                  backgroundColor: backgroundColor,
                  transition: isOpen ? "none" : "background-color 0.3s ease",
                  paddingTop: "var(--safe-area-inset-top)",
                }}
              >
                {loading && (
                  <div className="w-full h-full flex items-center justify-center absolute top-0 bg-white darkk:bg-dark-extra z-999">
                    <IonSpinner name="dots" />
                  </div>
                )}
                <MotionBottomSheet isOpen={isOpen} opacity={opacity}>
                  <div className="relative">
                    <div className="flex flex-col items-center justify-center bg-gray-50 darkk:!bg-black ">
                      <div className="w-full max-w-[450px] px-4  py-6  bg-white darkk:!bg-black ">
                        <div className="min-h-[fit-content] flex flex-col items-center relative w-full">
                          <div className="pt-6">
                            <img
                              src={dataStore?.organization?.logoLink || "/public/temp_logo.png"}
                              alt=""
                              className="w-28 h-28 rounded-full object-cover"
                              onError={(e) => handleImageError(e, "/public/temp_logo.png")}
                            />
                          </div>
                          <div className="pt-4 pb-10 text-center">
                            <span className="block font-semibold text-2xl darkk:text-white">
                              {t("Welcome!")}
                            </span>
                            <span className="text-gray-500">
                              {t("Let us know how you liked your meal")}
                            </span>
                          </div>
                          <div className="w-full">
                            <div>
                              <div className="font-medium darkk:text-white pb-1">
                                {t(`Which dish have you tried?`)}
                                {/* {" "}
                              <span className="text-red-500">*</span> */}
                              </div>
                              {selectedProducts.length > 0 ? (
                                <div
                                  onClick={() => openModal()}
                                  className="flex items-center justify-between w-full px-4 py-3 darkk:bg-dark-main rounded-xl cursor-pointer border border-gray-400 darkk:border-gray-700"
                                >
                                  <div className="flex flex-wrap gap-2">
                                    {selectedProducts.map((product: { id: number; name: string; }) => (
                                      <div
                                        key={product.id}
                                        className="px-2 py-1 bg-gray-200 darkk:bg-dark-extra rounded-xl text-sm flex items-center gap-1"
                                      >
                                        {product.name}
                                        <IoCloseOutline
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectProduct(product);
                                          }}
                                          className="cursor-pointer"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <IoChevronDownOutline />
                                </div>
                              ) : (
                                <button
                                  onClick={() => openModal()}
                                  className="mt-1 flex items-center justify-between w-full px-4 py-3 darkk:bg-dark-extra rounded-xl cursor-pointer border border-gray-400 darkk:border-gray-700"
                                >
                                  {t("Choose dishes")}
                                  <IoChevronDownOutline />
                                </button>
                              )}
                            </div>
                            <div className="mt-5">
                              <div className="font-medium darkk:text-white pb-1">
                                {t(`Share your feedback`)}
                              </div>
                              <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={4}
                                id="message"
                                className="w-full rounded-2xl px-4 py-3 darkk:bg-dark-main  border border-gray-400 darkk:border-gray-700 focus:border-main  focus:border focus:outline-none darkk:text-white placeholder:text-gray-500 "
                              ></textarea>
                            </div>
                            <div className="mt-5">
                              <div className="font-medium darkk:text-white pb-1">
                                {t(`Share your feedback`)}
                              </div>
                              <Menu as="div" className="relative inline-block text-left w-full">
                                <MenuButton className="flex items-center justify-between w-full px-4 py-3 rounded-2xl darkk:bg-dark-main border border-gray-400 darkk:border-gray-700 focus:border-main focus:border focus:outline-none darkk:text-white">
                                  {currentLangLabel}
                                  <IoChevronDownOutline />
                                </MenuButton>

                                <MenuItems className="absolute w-full right-0 z-10 mt-2 origin-top-right rounded-md bg-white darkk:bg-dark-extra shadow-lg ring-1 ring-black/5 focus:outline-hidden">
                                  <div className="py-1">
                                    {languages.map(({ code, label }) => (
                                      <MenuItem key={code}>
                                        {({ active }) => (
                                          <button
                                            onClick={() => setSelectedLang(code)}
                                            className={`block w-full text-left px-4 py-2 text-sm darkk:text-white ${active ? 'bg-gray-100 text-gray-900 darkk:bg-dark-main ' : 'text-gray-700 '
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
                            </div>
                            <div className="mt-5">
                              <div className="font-medium darkk:text-white pb-1">
                                {t(`Your images or videos`)}
                              </div>
                              <TakePhoto />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </MotionBottomSheet>
              </div>

              <SelectModal
                inputValue={inputValue}
                isOpen={isOpen}
                translateY={translateY}
                handleInputSearch={handleInputSearch}
                setInputValue={setInputValue}
                closeModal={closeModal}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                dataProduct={dataProduct}
                selectedProducts={selectedProducts}
                onSelectProduct={onSelectProduct}
                searchLoading={searchLoading}
              />
            </IonContent>
            {!isOpen && !loading && (
              <IonFooter className="!shadow-none !flex !justify-center">
                <IonToolbar>
                  <button
                    onClick={() => handleGenerate()}
                    className={`w-full py-3 px-4 rounded-3xl m-4  text-white ${isLoading
                      ? "loading-button"
                      : "bg-main hover:opacity-90"
                      }`}
                    disabled={isLoading}
                  >
                    {t("✨ Generate AI Feedback")}
                  </button>
                </IonToolbar>
              </IonFooter>
            )}
          </IonPage>
        )}
      </MotionStyles>

    </>
  );
};

export default ScannerById;
