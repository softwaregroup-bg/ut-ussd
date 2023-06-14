// @ts-check
import React from 'react';
import styled from './styled';

function handleSubmit(e) {
    e.preventDefault();
    return false;
}

function handleClear() {

}

function handleReset() {

}

/** @type { import("../../handlers").handlerFactory } */
export default ({
    import: {
        ussdMessageProcess,
        ussdConfigGet
    }
}) => ({
    'ussd.simulator.open': () => ({
        title: 'USSD Simulator',
        permission: 'ussd.simulator.open',
        component: async() => {
            let config = {};
            let historyText = '';
            try {
                config = await ussdConfigGet({});
            } catch (error) {
                historyText = `Error loading the configuration:\n${error.message}`;
            }
            const {
                defaultPhone,
                defaultShortCode
            } = config;
            return function FooOpen() {
                const classes = styled();
                const [
                    inputMessage,
                    inputPhone,
                    screen,
                    history
                ] = Array(4).fill().map(() => React.createRef());
                const handleButton = action => {
                    inputMessage.current.value = inputMessage.current.value + action.target.attributes['data-char'].value;
                };
                const handleSend = async action => {
                    const [phone, ussdMessage] = [inputPhone.current.value, inputMessage.current.value];
                    const {response} = await ussdMessageProcess({phone, ussdMessage});
                    screen.current.textContent = response;
                    historyText = `${historyText}${historyText ? '\n' : ''}${phone} ==> ${ussdMessage}\n${response}\n------------`;
                    history.current.textContent = historyText;
                    history.current.scrollTop = history.current.scrollHeight;
                    inputMessage.current.value = '';
                };
                return (
                    <div className={classes.phone}>
                        <div className={classes.mfspName}></div>
                        <form onSubmit={handleSubmit} className={classes.resultForm}>
                            <div className={classes.clock}></div>
                            <div className={classes.responseWrapper}>
                                <div className={classes.response}>
                                    <code ref={history}>{historyText}</code>
                                </div>
                            </div>
                            <div className={classes.phoneInputWrapper}>
                                <label className={classes.phoneInput}>
                                    <b>Phone :</b>
                                    <input type="text" name="phone" defaultValue={defaultPhone} ref={inputPhone}/>
                                </label>
                            </div>
                            <div className={classes.screen}>
                                <div className={classes.screen.charsCount}></div>
                                <div className={classes.infoPane}></div>
                                <div className={classes.phoneScreen}>
                                    <code ref={screen}></code>
                                </div>
                                <div className={classes.codeInput}>
                                    <input type="text" name="ussdMessage" defaultValue={defaultShortCode} ref={inputMessage} />
                                </div>
                            </div>
                            <button className={classes.sendCommand} onClick={handleSend}></button>
                            <div className={classes.redBtn} onClick={handleReset}></div>
                            <div className={classes.clearBtn} onClick={handleClear}></div>
                            <div className={classes.buttonsWrapper}>
                                <div className="phoneBtn row1 col1" onClick={handleButton} data-char='1'></div>
                                <div className="phoneBtn row1 col2" onClick={handleButton} data-char='2'></div>
                                <div className="phoneBtn row1 col3" onClick={handleButton} data-char='3'></div>
                                <div className="phoneBtn row2 col1" onClick={handleButton} data-char='4'></div>
                                <div className="phoneBtn row2 col2" onClick={handleButton} data-char='5'></div>
                                <div className="phoneBtn row2 col3" onClick={handleButton} data-char='6'></div>
                                <div className="phoneBtn row3 col1" onClick={handleButton} data-char='7'></div>
                                <div className="phoneBtn row3 col2" onClick={handleButton} data-char='8'></div>
                                <div className="phoneBtn row3 col3" onClick={handleButton} data-char='9'></div>
                                <div className="phoneBtn row4 col1" onClick={handleButton} data-char='*'></div>
                                <div className="phoneBtn row4 col2" onClick={handleButton} data-char='0'></div>
                                <div className="phoneBtn row4 col3" onClick={handleButton} data-char='#'></div>
                            </div>
                        </form>
                    </div>
                );
            };
        }
    })
});
