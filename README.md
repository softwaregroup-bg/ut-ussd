# ut-ussd - USSD menu engine

## Configuration options

```javascript
{
  utUssd: {
    ussd: {
      // refresh: gets refreshed on every cycle;
      // static(default): sets only once and will expire
      // in predefined period of time (timeOut);
      expireRule:  'refresh|static',
      timeOut: 1000, // expiration period definition
      shortCodes: { // short codes
        "*877#": "menu/entrance"
      },
      maintenanceModeState: "menu/maintenance", // maintenance mode state
      wrongInputState: "error/wrongInput", // wrong input state
      resumeState: "menu/resume", // resume state
      strings: [ // USSD strings
        "*877*1*1#",
        "*877*1*2#",
        "*877*2*1#",
        "*877*2*2#",
        "*877*2*3#",
        "*877*3*1#",
        "*877*3*2#",
        "*877*4#"
      ],
      defaultPhone: "1234", // default phone number for the simulator
      defaultShortCode: "*131#", // default short code for the simulator
      charsCount: true, // whether the characters count should be visible in the simulator
      // To display a slogan with the respective text above the phone number input
      // (no slogan will be displayed by default)
      slogan: 'Test'
    }
  }
}
```

## Views

USSD menu is defined in template files named `view.xml`, each one being in a separate
folder. Folders are usually structured to mirror the USSD menu structure.

For example:

```text
ussd
├── components
|   ├── back.xml
|   ├── backToHome.xml
|   └── footer.xml
└── menu
    ├── home
    |   └── view.xml
    ├── login
    |   └── view.xml
    └── error
    |   ├── runtimeError
    |   |   └── view.xml
    |   └── wrongInput
    |       └── view.xml
    └── account
        ├── balanceEnquiry
        |   └── view.xml
        └── miniStatement
            └── view.xml
```

The template files are JavaScript template literals, passed to
[ut-function.template](https://www.npmjs.com/package/ut-function.template) engine.
Each view file can contain some specific markup as in the below examples:

1. `Links` - links are defined with the tag `<a id="" href="">`,
   where the attribute `id` represents the USSD input, and `href`
   represents the next menu to show when this input is received.

   ```xml
   Menu
   <a id="1" href="menu/account">1. Account information</a>
   ```

1. `Expressions` - the standard syntax `${}` applicable to JS template
   literals can be used to define expressions, either simple ones like:

   ```text
   ${params.system.prevState}
   ```

   or more complex like iterating over array:

   ```text
   ${
     params.miniStatement.map(
       rec => `${rec.amount} on ${rec.postDate}`
     ).join(`<br/>`)
   }
   ```

   or for conditional rendering:

   ```text
   ${
     params.view === 'pin' ? 'Please enter your PIN' :
     params.view === 'wrongPin' ? `Wrong PIN.<br/>Please try again' :
       'Unexpected Error'
   }
   ```

1. `Translations` - the USSD template engine includes the function `T`,
   which can be used to translate text:

   ```text
   ${T`Please enter your PIN`}
   ```

   The syntax is based on JS [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates).

1. `Includes` - repeated fragments can be included in multiple views using the syntax:

   ```text
   Some menu

   ${include('../../components/back.xml')}
   ```

The essential API objects available in the views
`${}` expressions are:

- All `node.js` global objects
- `T` - the function used for translation
- `include` - the function used to include fragments
- `params` - object, containing the template parameters

The essential tags available in the views are:

- `<a id="" href="">link</a>` - for defining links to other menus
- `<br/>` - for line breaks

## Controllers

Each menu can have an optional `controller.js` file,
which handles actions related to the menu.
This file resides in the same folder as the menu's
respective `view.js`.
There are two optional actions, that can be defined:

1. `send`: This is executed before rendering the current
  menu. It can call other services to fetch data to be
  displayed in the menu.
1. `receive`: This is executed after receiving the
  response for a particular menu.

Controllers can be defined as object:

```js
module.exports = {
    async send(params) {
        // some processing
        return params;
    },
    async receive(params) {
        // some processing
        return params;
    }
};
```

Controllers can be also be defined as a function, returning an object.
This is useful when external API must be called using
the familiar destructuring syntax: `import:{}`.

>Note that `import` is the only available property at the moment.

```js
module.exports = ({
    import: {
        subjectObjectPredicate
    }
}) => ({
    async send(params) {
        try {
            const result = await subjectObjectPredicate({});
            // some processing
            return params;
        } catch (error) {
            params.error = error;
            this.redirect('menu/error/runtimeError');
            return params;
        }
    }
});
```

The official API objects available in the controllers are:

- `import: {subjectObjectPredicate}` - proxy for obtaining external API
- `this.redirect(view)` - for selecting the next view
