"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onClick: () => void;
}

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const STORAGE_KEY = "crm-ai-button-corner";
const OFFSET = 24;
const BUTTON_SIZE = 72;

export default function FloatingChatButton({ onClick }: Props) {
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dragStart = useRef({
    x: 0,
    y: 0,
  });

  const currentPosition = useRef({
    x: 0,
    y: 0,
  });

  const hasDragged = useRef(false);

  /*
   * Get position for a particular corner
   */
  const getCornerPosition = (selectedCorner: Corner) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    switch (selectedCorner) {
      case "top-left":
        return {
          x: OFFSET,
          y: OFFSET,
        };

      case "top-right":
        return {
          x: width - BUTTON_SIZE - OFFSET,
          y: OFFSET,
        };

      case "bottom-left":
        return {
          x: OFFSET,
          y: height - BUTTON_SIZE - OFFSET,
        };

      case "bottom-right":
      default:
        return {
          x: width - BUTTON_SIZE - OFFSET,
          y: height - BUTTON_SIZE - OFFSET,
        };
    }
  };

  /*
   * Set initial position
   */
  useEffect(() => {
    const savedCorner = localStorage.getItem(
      STORAGE_KEY
    ) as Corner | null;

    const initialCorner: Corner =
      savedCorner &&
      [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
      ].includes(savedCorner)
        ? savedCorner
        : "bottom-right";

    const initialPosition =
      getCornerPosition(initialCorner);

    setCorner(initialCorner);
    setPosition(initialPosition);
    currentPosition.current = initialPosition;
  }, []);

  /*
   * Keep button inside viewport if screen size changes
   */
  useEffect(() => {
    const handleResize = () => {
      const newPosition = getCornerPosition(corner);

      setPosition(newPosition);
      currentPosition.current = newPosition;
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, [corner]);

  /*
   * Start dragging
   */
  const handlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    hasDragged.current = false;

    dragStart.current = {
      x:
        e.clientX -
        currentPosition.current.x,
      y:
        e.clientY -
        currentPosition.current.y,
    };

    setIsDragging(true);

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  /*
   * Move button
   */
  const handlePointerMove = (
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (!isDragging) return;

    const newX =
      e.clientX - dragStart.current.x;

    const newY =
      e.clientY - dragStart.current.y;

    /*
     * Keep button inside viewport
     */
    const maxX =
      window.innerWidth -
      BUTTON_SIZE -
      OFFSET;

    const maxY =
      window.innerHeight -
      BUTTON_SIZE -
      OFFSET;

    const boundedX = Math.max(
      OFFSET,
      Math.min(newX, maxX)
    );

    const boundedY = Math.max(
      OFFSET,
      Math.min(newY, maxY)
    );

    const newPosition = {
      x: boundedX,
      y: boundedY,
    };

    currentPosition.current = newPosition;

    setPosition(newPosition);

    /*
     * Detect whether this was an actual drag
     */
    if (
      Math.abs(
        e.clientX - dragStart.current.x - currentPosition.current.x
      ) > 5 ||
      Math.abs(
        e.clientY - dragStart.current.y - currentPosition.current.y
      ) > 5
    ) {
      hasDragged.current = true;
    }
  };

  /*
   * Release button and snap to nearest corner
   */
  const handlePointerUp = (
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (!isDragging) return;

    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(
        e.pointerId
      );
    } catch {
      // Pointer capture may already be released
    }

    const { x, y } = currentPosition.current;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const centerX = x + BUTTON_SIZE / 2;
    const centerY = y + BUTTON_SIZE / 2;

    /*
     * Determine nearest corner
     */
    const distances = {
      "top-left":
        Math.pow(centerX, 2) +
        Math.pow(centerY, 2),

      "top-right":
        Math.pow(
          screenWidth - centerX,
          2
        ) +
        Math.pow(centerY, 2),

      "bottom-left":
        Math.pow(centerX, 2) +
        Math.pow(
          screenHeight - centerY,
          2
        ),

      "bottom-right":
        Math.pow(
          screenWidth - centerX,
          2
        ) +
        Math.pow(
          screenHeight - centerY,
          2
        ),
    };

    const nearestCorner = (
      Object.keys(distances) as Corner[]
    ).reduce((closest, current) =>
      distances[current] <
      distances[closest]
        ? current
        : closest
    );

    const snappedPosition =
      getCornerPosition(nearestCorner);

    setCorner(nearestCorner);
    setPosition(snappedPosition);

    currentPosition.current =
      snappedPosition;

    /*
     * Remember user's selected corner
     */
    localStorage.setItem(
      STORAGE_KEY,
      nearestCorner
    );

    /*
     * Reset drag state after click detection
     */
    setTimeout(() => {
      hasDragged.current = false;
    }, 50);
  };

  /*
   * Prevent opening chat when user was dragging
   */
  const handleClick = () => {
    if (hasDragged.current) return;

    onClick();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Open CRM AI Assistant"
      style={{
        position: "fixed",

        left: position.x,
        top: position.y,

        zIndex: 50,

        width: BUTTON_SIZE,
        height: BUTTON_SIZE,

        padding: 4,

        borderRadius: "9999px",

        border: "none",

        background:
          "linear-gradient(90deg, #8b5cf6, #3b82f6, #22d3ee)",

        boxShadow: isDragging
          ? "0 12px 30px rgba(59,130,246,0.45)"
          : "0 8px 20px rgba(0,0,0,0.25)",

        cursor: isDragging
          ? "grabbing"
          : "grab",

        transform: isDragging
          ? "scale(1.08)"
          : "scale(1)",

        transition: isDragging
          ? "none"
          : "left 0.35s ease, top 0.35s ease, transform 0.2s ease, box-shadow 0.2s ease",

        touchAction: "none",

        userSelect: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",

          overflow: "hidden",

          borderRadius: "9999px",

          background: "#ffffff",
        }}
      >
        <img
          src="/ai-avatar.jpg"
          alt="CRM AI Assistant"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      </div>
    </button>
  );
}