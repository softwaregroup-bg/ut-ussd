// @ts-check
import simulatorOpen from './ussd.simulator.open';

/** @type { import("../../handlers").handlerSet } */
export default function component() {
    return [
        () => ({ namespace: 'component/ussd' }),
        simulatorOpen
    ];
};
