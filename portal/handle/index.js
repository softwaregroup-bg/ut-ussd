// @ts-check
import send from './ussd.simulator.send';

/** @type { import("../../handlers").handlerSet } */
export default function handle() {
    return [
        () => ({ namespace: 'handle/ussd' }),
        send
    ];
};
