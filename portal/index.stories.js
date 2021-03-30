import {app} from 'ut-portal/storybook';
import portal from './';

export default {
    title: 'USSD'
};

const page = app({
    implementation: 'ussd',
    utUssd: true
}, {
    'core.translation.fetch': () => ({}),
    'ussd.message.process': ({phone, ussdMessage}) => ({
        response: `USSD menu for input ${ussdMessage} from ${phone} is:\n1. Demo\n0. Home`
    }),
    'ussd.config.get': () => ({
        defaultShortCode: '*123#',
        defaultPhone: '0888'
    })
}, [
    // utCore(),
    portal()
]);

export const SimulatorOpen = page('ussd.simulator.open');
