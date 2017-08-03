Configuration options

```javascript
// configuration
config = {
    // refresh: gets refreshed on every cycle;static(default): sets only once and will expire in predefined period of time (timeOut)
    expireRule:  'refresh|static',
    // expiration period definition
    timeOut: 1000,
    // shortcodes
    shortCodes: {
        "*877#": "menu/entrance"
    },
    // maintanenace mode state
    maintenanceModeState: "menu/maintenance",
    // wrong input state
    wrongInputState: "error/wrongInput",
    // resume state
    resumeState: "menu/resume",
    // ussd strings
    strings: ["*877*1*1#", "*877*1*2#", "*877*2*1#", "*877*2*2#", "*877*2*3#", "*877*3*1#", "*877*3*2#", "*877*4#"],
    // default phone number for the simulator
    defaultPhone: "1234",
    // default shortcode for the simulator
    defaultShortCode: "*131#",
    // whether the characters count should be visible in the simulator
    charsCount: true,
    // whether a slogan should be displayed above the phone number input
    slogan: 'Test MFSP 1'
}
```