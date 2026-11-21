import { useEffect } from "react";


const ACTIVITY_EVENTS = [
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
];

export function useInactivityLogout(enabled: boolean, onLogout: () => void | Promise<void>, timeout = 30 * 60 * 1000,) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        let timer: number;

        const resetTimer = () => {
            window.clearTimeout(timer);

            timer = window.setTimeout(() => {
                void onLogout();
            }, timeout);
        };

        ACTIVITY_EVENTS.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer();

        return () => {
            window.clearTimeout(timer);

            ACTIVITY_EVENTS.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [enabled, onLogout, timeout]);
}