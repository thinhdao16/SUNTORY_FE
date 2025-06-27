import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IonAccordion,
  IonAccordionGroup,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
} from "@ionic/react";
import { close, searchOutline } from "ionicons/icons";
import "@/styles/ionic.css";
interface SelectModalProps {
  isOpen: boolean;
  translateY: number;
  inputValue: string;
  handleInputSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setInputValue: (value: string) => void;
  closeModal: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  dataProduct: any;
  selectedProducts: { id: number; name: string }[];
  onSelectProduct: (products: { id: number; name: string }) => void;
  searchLoading: boolean;
}
interface Product { products: any[]; category: { id: any; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | Iterable<React.ReactNode> | null | undefined; }; }
const SelectModal: React.FC<SelectModalProps> = ({
  isOpen,
  translateY,
  handleInputSearch,
  closeModal,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  dataProduct,
  selectedProducts,
  onSelectProduct,
  inputValue,
  setInputValue,
  searchLoading
}) => {
  const accordionGroup = useRef<null | HTMLIonAccordionGroupElement>(null);

  const openAccordions =
    dataProduct?.map((item: Product, index: number) => index.toString());

  const hasAnyProduct = dataProduct?.some(
    (item: Product) => item.products && item.products.length > 0
  );
  useEffect(() => {
    return () => {
      setInputValue("");
    };
  }, []);


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 h-full flex justify-center items-end"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-[450px]  h-[87%] rounded-t-2xl overflow-hidden shadow-lg bg-white darkk:bg-dark-extra transition-transform duration-300 ease-out"
            style={{
              transform: `translateY(${translateY}px)`,
              touchAction: "none",
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <IonPage>
              <IonContent
                fullscreen
                scrollY={true}
                className="!bg-transparent"
              >
                <div className="px-4 pt-6 pb-2 sticky top-0 bg-white darkk:bg-dark-extra z-10 !rounded-t-2xl ">
                  <div className="flex justify-start items-center relative">
                    <span className="font-semibold darkk:text-white text-lg">
                      {t(`Which dish have you tried?`)}
                      {/* {" "}
                      <span className="text-red-500">*</span> */}
                    </span>
                    <button
                      className="absolute right-0 top-0 bg-gray-300 darkk:bg-dark-extra p-1 rounded-full flex items-center justify-center"
                      onClick={closeModal}
                    >
                      <IonIcon
                        icon={close}
                        className="text-xl text-gray-600 darkk:text-white"
                      />
                    </button>
                  </div>
                  <div className="mt-4 flex justify-between items-center gap-4">
                    <div className="w-full border border-gray-400   bg-white darkk:bg-dark-extra flex items-center rounded-4xl px-4  py-2.5 relative">
                      <input
                        type="text"
                        placeholder={t(`Search`)}
                        value={inputValue}
                        onChange={handleInputSearch}
                        className="w-full focus:outline-none relative"
                      />
                      <IonIcon
                        slot="start"
                        icon={searchOutline}
                        aria-hidden="true"
                        className="text-gray-500 text-xl "
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white darkk:bg-dark-extra pb-28 min-h-full">
                  {!searchLoading ? (
                    hasAnyProduct ? (
                      <IonAccordionGroup
                        ref={accordionGroup}
                        multiple={true}
                        className="gap-4 grid"
                        value={openAccordions}
                      >
                        {dataProduct?.map(
                          (item: Product, index: number) =>
                            item.products.length > 0 && (
                              <IonAccordion
                                key={`${item.category.id}-${index}`}
                                value={`${index}`}
                                className="border border-gray-200 darkk:border-gray-700 rounded-xl darkk:bg-dark-main"
                              >
                                <IonItem
                                  slot="header"
                                  color="none"
                                  className="custom-item"
                                >
                                  <IonLabel className="header-accordion-label p-4 !text-main">
                                    {item.category.name}
                                  </IonLabel>
                                </IonItem>
                                {item.products.map((product, idx: number) => (
                                  <div
                                    onClick={() => onSelectProduct(product)}
                                    className={`mx-4 pt-4 flex items-center gap-2 justify-between bg-white darkk:bg-dark-main text-black darkk:text-white ${idx === 0
                                      ? "border-t border-gray-300 darkk:border-gray-600"
                                      : ""
                                      } ${idx === item.products.length - 1
                                        ? "pb-4"
                                        : ""
                                      }`}
                                    slot="content"
                                    key={`${product.id}-${index}`}
                                  >
                                    <span className="font-medium darkk:text-white">
                                      {product.name}
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={selectedProducts?.some(
                                        (p: any) => p.id === product.id
                                      )}
                                      className="accent-black w-5 h-5 border border-gray-300 darkk:border-gray-700 !rounded-full cursor-pointer"
                                    />
                                  </div>
                                ))}
                              </IonAccordion>
                            )
                        )}
                      </IonAccordionGroup>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p>{t("Nothing product")}</p>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IonSpinner name="dots" />
                    </div>
                  )}
                </div>
                <div className="w-full flex items-center justify-center fixed bottom-8 inset-x-0">
                  <div className="max-w-[450px] w-full px-4">
                    <button
                      onClick={() => closeModal()}
                      className={` w-full py-3 px-4 rounded-3xl mt-4 text-white ${false ? "loading-button" : "bg-main  hover:opacity-90"
                        }`}
                    >
                      {t("Done")}
                    </button>
                  </div>
                </div>
              </IonContent>
            </IonPage>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectModal;
