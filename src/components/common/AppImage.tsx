import React, { useCallback, useEffect, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { motion } from "framer-motion";
import "react-lazy-load-image-component/src/effects/blur.css";

type Effect = "blur" | "black-and-white" | "opacity";

type AppImageProps = {
  src: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  placeholderSrc?: string;
  effect?: Effect;
  onLoad?: () => void;
  hardHeight?: number;
  animate?: boolean;
  animationType?: "fade" | "fadeScale";
  duration?: number;
  fit?: "cover" | "contain";
  backgroundColor?: string;
  serverSrc?: string;
  [key: string]: any;
};

const AppImage: React.FC<AppImageProps> = ({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  placeholderSrc = "/favicon.png",
  effect = "blur",
  onLoad,
  hardHeight = 200,
  animate = true,
  animationType = "fadeScale",
  duration = 0.25,
  fit = "contain",
  backgroundColor = "#f3f4f6",
  serverSrc, 
  style,
  ...props
}) => {
  const [localLoaded, setLocalLoaded] = useState(false);
  const [serverLoaded, setServerLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLocalLoad = useCallback(() => {
    setLocalLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleServerLoad = useCallback(() => {
    setServerLoaded(true);
    console.log("✅ Server image loaded, ready to transition");
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setLocalLoaded(false);
  }, []);

  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      if (!src?.startsWith("blob:")) {
        setLocalLoaded(false);
        setServerLoaded(false);
        setHasError(false);
      }
    }
  }, [src, currentSrc]);

  const variants =
    animationType === "fadeScale"
      ? { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } }
      : { hidden: { opacity: 0 }, show: { opacity: 1 } };

  return (
    <div
      className={wrapperClassName}
      style={{
        minHeight: hardHeight,
        position: "relative",
        backgroundColor,
        ...style,
      }}
    >
      {/* ✅ Local/Primary image layer */}
      <motion.div
        initial="hidden"
        animate={localLoaded && animate ? "show" : "hidden"}
        variants={variants}
        transition={{ duration }}
        className="absolute inset-0"
        style={{
          willChange: "opacity, transform",
          zIndex: serverLoaded ? 1 : 2,
        }}
      >
        <LazyLoadImage
          src={currentSrc}
          alt={alt}
          className={className}
          effect={effect}
          placeholderSrc={placeholderSrc}
          onLoad={handleLocalLoad}
          onError={handleError}
          width="100%"
          height="100%"
          style={{
            width: "100%",
            height: "100%",
            objectFit: fit,
            objectPosition: "center",
          }}
          decoding="async"
          loading="lazy"
          {...props}
        />
      </motion.div>

      {serverSrc && serverSrc !== currentSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: serverLoaded ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            willChange: "opacity",
            zIndex: serverLoaded ? 2 : 1,
          }}
        >
          <LazyLoadImage
            src={serverSrc}
            alt={alt}
            className={className}
            effect="opacity"
            onLoad={handleServerLoad}
            onError={() => {
              console.warn("Server image failed to load");
            }}
            width="100%"
            height="100%"
            style={{
              width: "100%",
              height: "100%",
              objectFit: fit,
              objectPosition: "center",
            }}
            decoding="async"
            loading="lazy"
          />
        </motion.div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <span className="text-gray-500 text-xs">Failed to load</span>
        </div>
      )}
    </div>
  );
};

export default AppImage;
