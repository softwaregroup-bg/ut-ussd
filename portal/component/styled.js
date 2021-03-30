// @ts-check
import { withStyles, createStyles } from '@material-ui/core/styles';
// @ts-ignore
import phone from './phone.png';

export default withStyles(createStyles({
    resultForm: {
        display: 'block',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        '& label *': {
            float: 'left'
        },
        '& label b': {
            margin: '3px 10px 0 0'
        },
        '& label input': {
            border: '1px solid #ccc'
        },
        '& .hidden': {
            display: 'none'
        }
    },
    '.clock.started': {
        fontWeight: 'bold',
        color: 'red'
    },
    phone: {
        margin: 20,
        width: '100%',
        height: 600,
        background: `url(${phone}) no-repeat top left`,
        '& *': {
            MozBoxSizing: 'border-box',
            WebkitBoxSizing: 'border-box',
            boxSizing: 'border-box',
            position: 'absolute'
        }
    },
    screen: {
        position: 'relative',
        width: 166,
        height: 204,
        background: '#FFF',
        top: 86,
        left: 67,
        fontFamily: 'Lucida Console, Monaco, monospace',
        fontSize: 14,
        fontWeight: 'bold',
        overflow: 'visible',
        '& .charsCount': {
            position: 'absolute',
            right: 0,
            top: '-12px',
            color: '#AAA',
            fontSize: 10,
            fontWeight: 'normal'
        },
        '& input': {
            fontFamily: 'Lucida Console, Monaco, monospace',
            fontSize: 14,
            width: 156,
            height: 25,
            border: '1px solid #DDD',
            color: '.333',
            padding: '0 10px'
        }
    },
    phoneScreen: {
        width: '100%',
        height: 165,
        padding: 5,
        overflowY: 'auto',
        overflowX: 'hidden',
        wordWrap: 'break-word',
        '& code': {
            whiteSpace: 'pre-wrap',
            color: 'black',
            width: '100%',
            paddingRight: 10
        }
    },
    mfspName: {
        left: 300,
        width: 400,
        height: 25,
        textAlign: 'center',
        fontSize: 18,
        color: '#E30613',
        fontWeight: 'bold',
        fontFamily: 'Arial, Verdana, sans-serif'
    },
    infoPane: {
        width: '100%',
        height: '100%',
        paddingTop: 60,
        background: 'white',
        display: 'none',
        zIndex: 99,
        textAlign: 'center'
    },
    codeInput: {
        width: '100%',
        height: 35,
        top: 170,
        padding: 5
    },
    sendCommand: {
        width: 37,
        height: 23,
        left: 55,
        top: 364,
        cursor: 'pointer',
        background: 'none',
        border: 'none'
    },
    redBtn: {
        width: 36,
        height: 27,
        left: 210,
        top: 361,
        cursor: 'pointer'
    },
    responseWrapper: {
        width: 400,
        left: 300,
        top: 70,
        '& *': {
            position: 'static'
        },
        '& .customerName': {
            paddingBottom: 5,
            wordWrap: 'break-word',
            display: 'none'
        },
        '& .customerName *': {
            display: 'inline'
        },
        '& .customerName span': {
            paddingLeft: 10,
            fontSize: 16
        }
    },
    response: {
        width: '100%',
        height: 480,
        fontSize: 16,
        color: '#555',
        '& code': {
            whiteSpace: 'pre-wrap',
            position: 'absolute',
            overflowY: 'scroll',
            width: '100%',
            height: '100%',
            padding: 10,
            background: '#FAFAFA'
        }
    },
    clock: {
        left: 640,
        top: 40,
        fontSize: 14,
        cursor: 'pointer'
    },
    phoneInputWrapper: {
        width: 270,
        left: 300,
        top: 35,
        '& *': {
            position: 'static'
        }
    },
    clearBtn: {
        width: 41,
        height: 28,
        top: 329,
        left: 206,
        cursor: 'pointer'
    },
    buttonsWrapper: {
        width: 209,
        height: 155,
        top: 400,
        left: 46,
        '& .phoneBtn': {
            width: 65,
            height: 35,
            cursor: 'pointer'
        },
        '& .col1': {left: 1},
        '& .col2': {left: 72},
        '& .col3': {left: 142},
        '& .row1': {top: 4},
        '& .row2': {top: 42},
        '& .row3': {top: 79},
        '& .row4': {top: 116}
    },
    loading: {
        background: 'url(../img/loading.gif) no-repeat center center #FFF'
    }
}));
