/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonContent, IonPage } from "@ionic/react";
import { useHistory } from "react-router";
import { IoIosArrowBack } from "react-icons/io";
import "./Rate.module.css";
import { FaGoogle, FaUtensils } from "react-icons/fa";
import { IoCopyOutline, IoLogoFacebook, IoRepeat } from "react-icons/io5";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { handleCopyToClipboard } from "@/components/common/HandleCoppy";
import TakePhoto from "@/components/take-photo/TakePhoto";
import withColorSetup from "@/hocs/withColorSetup";
import { useScannerStore } from "@/store/zustand/scanner-store";
import { useToastStore } from "@/store/zustand/toast-store";


function Rate() {
  const history = useHistory();

  const dataRate = useScannerStore((state) => state.dataRate);
  const dataStore = useScannerStore((state) => state.resultStore);
  const resultReview = useScannerStore((state) => state.resultReview);
  const updateScannerFeedback = useScannerStore(
    (state) => state.updateScannerFeedback
  );
  const submitScannerFeedback = useScannerStore(
    (state) => state.submitScannerFeedback
  );
  const isLoading = useScannerStore((state) => state.isLoading);

  const myData = useMemo(
    () => ({ dataRate, dataStore, resultReview }),
    [dataRate, dataStore, resultReview]
  );

  const [localData, setLocalData] = useState<any>(myData);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const review = localData?.resultReview?.review || "";

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
        }, 0);
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedReview = e.target.value;

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }

    setLocalData((prevData: any) => ({
      ...prevData,
      resultReview: {
        ...prevData?.resultReview,
        review: updatedReview,
      },
    }));
  };

  useEffect(() => {
    setLocalData(myData);
    autoResize();
  }, [myData]);

  const handleUpdateFeedback = async (reviewLink: {
    link: string;
    enumLink: number;
  }) => {
    if (!localData?.dataRate) {
      console.error("No dataRate available to update feedback.");
      return;
    }
    const dataUpdateReviewStatus = {
      productIds: localData.dataRate.productIds,
      deviceId: localData.dataRate.deviceId,
      shareButtonClicked: reviewLink.enumLink,
    };

    try {
      await updateScannerFeedback(dataUpdateReviewStatus);
    } catch (error: any) {
      console.error("Failed to update feedback:", error.message);
    } finally {
      // window.open(reviewLink.link, "_blank");
    }
  };

  const handleGenerate = async () => {
    try {
      await submitScannerFeedback(localData.dataRate);
      const updatedResultReview: any = useScannerStore.getState().resultReview;
      if (!updatedResultReview || updatedResultReview.length === 0) {
        throw new Error("No review data available.");
      }
      setLocalData((prevData: any) => {
        return {
          ...prevData,
          resultReview: {
            ...prevData?.resultReview,
            review: updatedResultReview.review || "",
          },
        }
      });
      handleCopyToClipboard(updatedResultReview.review || "");

    } catch (error: any) {
      const showToast = useToastStore.getState().showToast;
      showToast(
        error.message || "Failed to submit feedback. Please try again.",
        3000
      );
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen scrollY={true}>
        <div className="bg-gray-50 flex justify-center min-h-full darkk:!bg-black">
          <div className="w-full max-w-[450px] px-4 bg-white darkk:!bg-black min-h-full flex flex-col justify-between">
            <div className="w-full">
              <button onClick={() => history.goBack()}>
                <IoIosArrowBack className="text-2xl mt-4 darkk:text-white" />
              </button>
              <div className="flex flex-col items-center">
                <div className="pt-4 pb-10 w-full">
                  <span className="block font-semibold text-xl darkk:text-white text-center">
                    {t("How do you feel about the meal?")}
                  </span>
                  {/* <Rating
                    initialRating={localData?.dataRate?.rating || 4}
                    onChange={(value) => {
                      setLocalData((prevData: any) => ({
                        ...prevData,
                        dataRate: {
                          ...prevData?.dataRate,
                          rating: value,
                        },
                      }));
                    }}
                  /> */}
                  <div className="mt-7">
                    <div className="pb-2 text-start darkk:text-white">
                      AI-Generated Feedback
                    </div>
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      id="message"
                      placeholder="Rating"
                      value={review}
                      onChange={handleChange}
                      className="w-full min-h-40 rounded-2xl px-3 py-2 darkk:bg-black border border-gray-300 darkk:border-gray-700 focus:border-main focus:border-3 focus:outline-none darkk:text-white placeholder:text-gray-500 resize-none overflow-hidden"
                    />
                  </div>
                  <div className="flex gap-4 items-center">
                    <button
                      className={`text-white font-medium rounded-full px-4 py-2 mt-4 w-full flex items-center gap-2 justify-center ${isLoading
                        ? "loading-button"
                        : "bg-main hover:opacity-90"
                        }`}
                      onClick={handleGenerate}
                    >
                      <IoRepeat className="w-5 h-5" /> {t("Re-generate")}
                    </button>
                    <button
                      className="bg-gray-300 text-black font-medium rounded-full px-4 py-2 mt-4 w-full flex items-center gap-2 justify-center"
                      onClick={() =>
                        handleCopyToClipboard(localData?.resultReview?.review)
                      }
                    >
                      <IoCopyOutline /> {t("Copy")}
                    </button>
                  </div>
                  <div className="mt-5">

                    <TakePhoto />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4 pb-8">
              {localData?.dataStore?.googleReviewLink && (
                <a
                  href={localData.dataStore.googleReviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    handleUpdateFeedback({
                      link: localData.dataStore.googleReviewLink,
                      enumLink: 10,
                    })
                  }
                  className="flex items-center justify-start w-full pl-6 py-3 border bg-white border-gray-300 rounded-full text-gray-700 hover:bg-gray-100"
                >
                  <FaGoogle className="text-xl mr-2" />
                  {t("Submit a review via Google")}
                </a>
              )}
              {localData?.dataStore?.facebookLink && (
                <a
                  href={localData.dataStore.facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    handleUpdateFeedback({
                      link: localData.dataStore.facebookLink,
                      enumLink: 20,
                    })
                  }
                  className="flex items-center justify-start w-full pl-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                >
                  <IoLogoFacebook className="text-xl mr-2" />
                  {t("Submit a review via Facebook")}
                </a>
              )}
              {localData?.dataStore?.foodyReviewLink && (
                <a
                  href={localData.dataStore.foodyReviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    handleUpdateFeedback({
                      link: localData.dataStore.foodyReviewLink,
                      enumLink: 30,
                    })
                  }
                  className="flex items-center justify-start w-full pl-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <FaUtensils className="text-xl mr-2" />
                  {t("Submit a review via Foody")}
                </a>
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default withColorSetup(Rate);
