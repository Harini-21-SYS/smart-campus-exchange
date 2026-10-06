import { useEffect } from "react";

/**
 * Locks background page scroll while a modal is mounted. Every modal
 * in this app only mounts when it's actually open ({x && <Modal/>}),
 * so calling this unconditionally inside a modal component is safe —
 * it locks on mount, unlocks on unmount.
 */
export default function useLockBodyScroll() {
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);
}