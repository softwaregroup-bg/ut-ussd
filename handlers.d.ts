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
export interface handlers<location = ''> {
  'ussd.config.get'?: ut.handler<ussd.config.get.params, ussd.config.get.result, location>,
  ussdConfigGet?: ut.handler<ussd.config.get.params, ussd.config.get.result, location>,
  'ussd.config.getRest'?: ut.handler<ussd.config.getRest.params, ussd.config.getRest.result, location>,
  ussdConfigGetRest?: ut.handler<ussd.config.getRest.params, ussd.config.getRest.result, location>,
  'ussd.message.process'?: ut.handler<ussd.message.process.params, ussd.message.process.result, location>,
  ussdMessageProcess?: ut.handler<ussd.message.process.params, ussd.message.process.result, location>,
  'ussd.message.processRest'?: ut.handler<ussd.message.processRest.params, ussd.message.processRest.result, location>,
  ussdMessageProcessRest?: ut.handler<ussd.message.processRest.params, ussd.message.processRest.result, location>,
  'ussd.session.fetchRest'?: ut.handler<ussd.session.fetchRest.params, ussd.session.fetchRest.result, location>,
  ussdSessionFetchRest?: ut.handler<ussd.session.fetchRest.params, ussd.session.fetchRest.result, location>,
  'ussd.session.getRest'?: ut.handler<ussd.session.getRest.params, ussd.session.getRest.result, location>,
  ussdSessionGetRest?: ut.handler<ussd.session.getRest.params, ussd.session.getRest.result, location>,
  'ussd.session.removeRest'?: ut.handler<ussd.session.removeRest.params, ussd.session.removeRest.result, location>,
  ussdSessionRemoveRest?: ut.handler<ussd.session.removeRest.params, ussd.session.removeRest.result, location>
}

export interface errors {

}


export type libFactory = ut.libFactory<methods, errors>
export type handlerFactory = ut.handlerFactory<methods, errors, handlers<'local'>>
export type handlerSet = ut.handlerSet<methods, errors, handlers<'local'>>

import portal from 'ut-portal'
export type pageFactory = portal.pageFactory<methods, errors>
export type pageSet = portal.pageSet<methods, errors>
