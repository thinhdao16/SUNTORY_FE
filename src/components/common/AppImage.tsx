import React, { useMemo, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { motion, AnimatePresence } from "framer-motion";
import "react-lazy-load-image-component/src/effects/blur.css";
import { useImageSize } from "@/hooks/useImageSize";

type Effect = "blur" | "black-and-white" | "opacity";

type AppImageProps = {
  src: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  placeholderSrc?: string;
  effect?: Effect;
  onLoad?: () => void;

  fallbackRatio?: number;
  hardHeight?: number;

  animate?: boolean;
  animationType?: "fade" | "fadeScale";
  duration?: number;
  [key: string]: any;
  fit?: "cover" | "contain";
  backgroundColor?: string;
};

const AppImage: React.FC<AppImageProps> = ({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  motionClassName = "",
  placeholderSrc = "/favicon.png",
  effect = "blur",
  onLoad,

  fallbackRatio = 4 / 3,
  hardHeight = 200,

  animate = true,
  animationType = "fadeScale",
  duration = 0.25,

  fit = "contain",
  backgroundColor = "#f3f4f6",

  style,
  ...props
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const measured = useImageSize(src);

  const ratio = useMemo(() => {
    if (measured?.width && measured?.height) {
      const r = measured.width / measured.height;
      return r > 0 ? r : fallbackRatio;
    }
    return fallbackRatio;
  }, [measured, fallbackRatio]);

  const handleLoad = () => {
    setImgLoaded(true);
    onLoad?.();
  };

  const variants =
    animationType === "fadeScale"
      ? { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } }
      : { hidden: { opacity: 0 }, show: { opacity: 1 } };


  return (
    <div
      className={wrapperClassName}
      style={{
        // aspectRatio: ratio,
        minHeight: hardHeight,
        position: "relative",
        backgroundColor,
        ...style,
      }}
    >
      <AnimatePresence>
        {!imgLoaded && (
          <motion.div
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 overflow-hidden rounded-2xl ${motionClassName}`}
          >
            <div className="w-full h-full bg-gray-200" />
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial="hidden"
        animate={imgLoaded && animate ? "show" : "hidden"}
        variants={variants}
        transition={{ duration }}
        className="absolute inset-0"
        style={{ willChange: "opacity, transform" }}
      >
        <LazyLoadImage
          src={src}
          alt={alt}
          className={className}
          effect={effect}
          placeholderSrc={placeholderSrc}
          onLoad={handleLoad}
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
    </div>
  );
};

export default AppImage;
