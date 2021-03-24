declare namespace ussd.config.get {
  
  
}

declare namespace ussd.message.process {
  
  
}

declare namespace ussd.session.fetch {
  
  
}

declare namespace ussd.session.get {
  
  
}

declare namespace ussd.session.remove {
  
  
}

import ut from 'ut-run';
export interface handlers {
  'ussd.config.get': ut.remoteHandler<ussd.config.get.params, ussd.config.get.result>,
  ussdConfigGet: ut.remoteHandler<ussd.config.get.params, ussd.config.get.result>,
  'ussd.message.process': ut.remoteHandler<ussd.message.process.params, ussd.message.process.result>,
  ussdMessageProcess: ut.remoteHandler<ussd.message.process.params, ussd.message.process.result>,
  'ussd.session.fetch': ut.remoteHandler<ussd.session.fetch.params, ussd.session.fetch.result>,
  ussdSessionFetch: ut.remoteHandler<ussd.session.fetch.params, ussd.session.fetch.result>,
  'ussd.session.get': ut.remoteHandler<ussd.session.get.params, ussd.session.get.result>,
  ussdSessionGet: ut.remoteHandler<ussd.session.get.params, ussd.session.get.result>,
  'ussd.session.remove': ut.remoteHandler<ussd.session.remove.params, ussd.session.remove.result>,
  ussdSessionRemove: ut.remoteHandler<ussd.session.remove.params, ussd.session.remove.result>
}

export interface errors {

}


export type libFactory = ut.libFactory<methods, errors>
export type handlerFactory = ut.handlerFactory<methods, errors>
export type handlerSet = ut.handlerSet<methods, errors>
