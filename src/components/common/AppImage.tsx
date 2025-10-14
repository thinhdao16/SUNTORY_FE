import React, { useCallback, useEffect, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { motion } from "framer-motion";
import "react-lazy-load-image-component/src/effects/blur.css";

type Effect = "blur" | "black-and-white" | "opacity";
export type MediaType = "image" | "video" | "auto" ;

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
  mediaType?: MediaType | any;
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>; 
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
  fit = "cover",
  backgroundColor = "#f3f4f6",
  serverSrc,
  mediaType = "auto",
  videoProps = {},
  style,
  ...props
}) => {
  const [localLoaded, setLocalLoaded] = useState(false);
  const [serverLoaded, setServerLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [detectedMediaType, setDetectedMediaType] = useState<"image" | "video">("image");

  // Function to detect media type from URL or file extension
  const detectMediaType = useCallback((url: string): "image" | "video" => {
    if (mediaType !== "auto") {
      return mediaType as "image" | "video";
    }
    
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    
    const urlLower = url.toLowerCase();
    
    if (videoExtensions.some(ext => urlLower.includes(ext))) {
      return "video";
    }
    
    if (imageExtensions.some(ext => urlLower.includes(ext))) {
      return "image";
    }
    
    // Default to image if can't determine
    return "image";
  }, [mediaType]);

  const handleLocalLoad = useCallback(() => {
    setLocalLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleServerLoad = useCallback(() => {
    setServerLoaded(true);
    console.log("✅ Server media loaded, ready to transition");
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setLocalLoaded(false);
  }, []);

  const handleVideoLoad = useCallback(() => {
    setLocalLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleServerVideoLoad = useCallback(() => {
    setServerLoaded(true);
    console.log("✅ Server video loaded, ready to transition");
  }, []);

  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setDetectedMediaType(detectMediaType(src));
      if (!src?.startsWith("blob:")) {
        setLocalLoaded(false);
        setServerLoaded(false);
        setHasError(false);
      }
    }
  }, [src, currentSrc, detectMediaType]);

  const variants =
    animationType === "fadeScale"
      ? { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } }
      : { hidden: { opacity: 0 }, show: { opacity: 1 } };

  const commonStyle = {
    width: "100%",
    height: "100%",
    objectFit: fit,
    objectPosition: "center",
  };

  const renderMedia = (mediaSrc: string, isServer = false) => {
    const currentMediaType = detectMediaType(mediaSrc);
    
    if (currentMediaType === "video") {
      return (
        <video
          src={mediaSrc}
          className={className}
          onLoadedData={isServer ? handleServerVideoLoad : handleVideoLoad}
          onError={handleError}
          style={commonStyle}
          controls
          preload="metadata"
          {...videoProps}
        />
      );
    } else {
      return (
        <LazyLoadImage
          src={mediaSrc}
          alt={alt}
          className={className}
          effect={isServer ? "opacity" : effect}
          placeholderSrc={isServer ? undefined : placeholderSrc}
          onLoad={isServer ? handleServerLoad : handleLocalLoad}
          onError={handleError}
          width="100%"
          height="100%"
          style={commonStyle}
          decoding="async"
          loading="lazy"
          {...props}
        />
      );
    }
  };

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
      {/* ✅ Local/Primary media layer */}
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
        {renderMedia(currentSrc)}
      </motion.div>

      {/* ✅ Server media layer */}
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
          {renderMedia(serverSrc, true)}
        </motion.div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <span className="text-gray-500 text-xs">{t("Failed to load")}</span>
        </div>
      )}
    </div>
  );
};

export default AppImage;
