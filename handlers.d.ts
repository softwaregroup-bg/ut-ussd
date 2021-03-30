declare namespace ussd.config.get {
  export interface params {
  
  }
  export interface result {
  
  }
}

declare namespace ussd.config.getRest {
  
  
}

declare namespace ussd.message.process {
  export interface params {
    phone: string;
    ussdMessage: string;
    newSession?: boolean;
  }
  export interface result {
    response?: string;
  }
}

declare namespace ussd.message.processRest {
  
  
}

declare namespace ussd.session.fetchRest {
  
  
}

declare namespace ussd.session.getRest {
  
  
}

declare namespace ussd.session.removeRest {
  
  
}

import ut from 'ut-run';
export interface handlers {
  'ussd.config.get': ut.remoteHandler<ussd.config.get.params, ussd.config.get.result>,
  ussdConfigGet: ut.remoteHandler<ussd.config.get.params, ussd.config.get.result>,
  'ussd.config.getRest': ut.remoteHandler<ussd.config.getRest.params, ussd.config.getRest.result>,
  ussdConfigGetRest: ut.remoteHandler<ussd.config.getRest.params, ussd.config.getRest.result>,
  'ussd.message.process': ut.remoteHandler<ussd.message.process.params, ussd.message.process.result>,
  ussdMessageProcess: ut.remoteHandler<ussd.message.process.params, ussd.message.process.result>,
  'ussd.message.processRest': ut.remoteHandler<ussd.message.processRest.params, ussd.message.processRest.result>,
  ussdMessageProcessRest: ut.remoteHandler<ussd.message.processRest.params, ussd.message.processRest.result>,
  'ussd.session.fetchRest': ut.remoteHandler<ussd.session.fetchRest.params, ussd.session.fetchRest.result>,
  ussdSessionFetchRest: ut.remoteHandler<ussd.session.fetchRest.params, ussd.session.fetchRest.result>,
  'ussd.session.getRest': ut.remoteHandler<ussd.session.getRest.params, ussd.session.getRest.result>,
  ussdSessionGetRest: ut.remoteHandler<ussd.session.getRest.params, ussd.session.getRest.result>,
  'ussd.session.removeRest': ut.remoteHandler<ussd.session.removeRest.params, ussd.session.removeRest.result>,
  ussdSessionRemoveRest: ut.remoteHandler<ussd.session.removeRest.params, ussd.session.removeRest.result>
}

export interface errors {

}


export type libFactory = ut.libFactory<methods, errors>
export type handlerFactory = ut.handlerFactory<methods, errors>
export type handlerSet = ut.handlerSet<methods, errors>
