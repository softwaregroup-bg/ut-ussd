// @ts-check
import component from './component';
import handle from './handle';

export default () => function utUssd() {
    return {
        config: require('./config'),
        browser: () => [
            function backend() {
                return {namespace: 'ussd'};
            },
            component,
            handle
        ]
    };
};
