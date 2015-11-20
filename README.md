if you want to register to specific server ussd web handlers, you should put special configuration, for instance:

```javascript
//(dev|test|prod).json
"ussd" : {
  "registerRequestHandlers": ["server_a.registerRequestHandler", "server_b.registerRequestHandler"],
  "initRoutes": true,
  //.......
}

```

based on this ussd config ussd module will try to register its ussd simulator handlers in server_a and server_b