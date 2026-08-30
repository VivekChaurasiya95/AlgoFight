import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./circular-testimonials.css";

function calculateGap(width) {
  const minWidth = 768;
  const maxWidth = 1200;
  const minGap = 40;
  const maxGap = 65;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return maxGap;
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export const CircularTestimonials = ({
  testimonials = [],
  autoplay = true,
  interval = 3800,
  colors = {},
  fontSizes = {},
}) => {
  // Color & font config
  const colorName = colors.name ?? "#00e5ff";
  const colorDesignation = colors.designation ?? "#94a3b8";
  const colorTestimony = colors.testimony ?? "#e2e8f0";
  const fontSizeName = fontSizes.name ?? "1.45rem";
  const fontSizeDesignation = fontSizes.designation ?? "0.9rem";
  const fontSizeQuote = fontSizes.quote ?? "1.08rem";

  // State
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);

  const imageContainerRef = useRef(null);
  const autoplayIntervalRef = useRef(null);

  const testimonialsLength = useMemo(() => testimonials.length || 1, [testimonials]);
  const activeTestimonial = useMemo(
    () => testimonials[activeIndex] || testimonials[0] || {},
    [activeIndex, testimonials]
  );

  // Responsive gap calculation
  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fully automatic cyclical transition
  useEffect(() => {
    if (autoplay && testimonialsLength > 1) {
      autoplayIntervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % testimonialsLength);
      }, interval);
    }
    return () => {
      if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
    };
  }, [autoplay, interval, testimonialsLength]);

  // Compute 3D transforms for compact, elegant card stack
  function getImageStyle(index) {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.6;
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + testimonialsLength) % testimonialsLength === index;
    const isRight = (activeIndex + 1) % testimonialsLength === index;

    if (isActive) {
      return {
        zIndex: 3,
        opacity: 1,
        pointerEvents: "auto",
        transform: `translateX(0px) translateY(0px) scale(1) rotateY(0deg)`,
        transition: "all 0.75s cubic-bezier(.4,1.8,.3,1)",
      };
    }
    if (isLeft) {
      return {
        zIndex: 2,
        opacity: 0.75,
        pointerEvents: "auto",
        transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.82) rotateY(12deg)`,
        transition: "all 0.75s cubic-bezier(.4,1.8,.3,1)",
      };
    }
    if (isRight) {
      return {
        zIndex: 2,
        opacity: 0.75,
        pointerEvents: "auto",
        transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.82) rotateY(-12deg)`,
        transition: "all 0.75s cubic-bezier(.4,1.8,.3,1)",
      };
    }
    return {
      zIndex: 1,
      opacity: 0,
      pointerEvents: "none",
      transition: "all 0.75s cubic-bezier(.4,1.8,.3,1)",
    };
  }

  const quoteVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div className="circular-testimonial-container">
      <div className="circular-testimonial-grid">
        {/* Compact 3D Profile Photo Stage */}
        <div className="circular-image-container" ref={imageContainerRef}>
          {testimonials.map((testimonial, index) => (
            <img
              key={testimonial.src || index}
              src={testimonial.src}
              alt={testimonial.name}
              className="circular-testimonial-image"
              data-index={index}
              style={getImageStyle(index)}
            />
          ))}
        </div>

        {/* Dynamic Auto-Shifting Testimonial Copy */}
        <div className="circular-testimonial-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={quoteVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <h3
                className="circular-name"
                style={{ color: colorName, fontSize: fontSizeName }}
              >
                {activeTestimonial.name}
              </h3>
              <p
                className="circular-designation"
                style={{ color: colorDesignation, fontSize: fontSizeDesignation }}
              >
                {activeTestimonial.designation}
              </p>
              <motion.p
                className="circular-quote"
                style={{ color: colorTestimony, fontSize: fontSizeQuote }}
              >
                {(activeTestimonial.quote || "").split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{
                      filter: "blur(8px)",
                      opacity: 0,
                      y: 4,
                    }}
                    animate={{
                      filter: "blur(0px)",
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.2,
                      ease: "easeInOut",
                      delay: 0.018 * i,
                    }}
                    style={{ display: "inline-block" }}
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* Minimal Automated Progress Dots */}
          <div className="circular-auto-indicators">
            {testimonials.map((_, i) => (
              <span
                key={i}
                className={`circular-dot ${i === activeIndex ? "active" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularTestimonials;
