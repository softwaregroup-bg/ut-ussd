declare namespace ussdTableTypes {}
declare namespace ussd_config_get {
  export interface params {}
  export interface result {}
}

declare namespace ussd_config_getRest {
  
  
}

declare namespace ussd_message_process {
  export interface params {
    newSession?: boolean;
    phone: string;
    ussdMessage: string;
  }
  export interface result {
    response?: string;
  }
}

declare namespace ussd_message_processRest {
  
  
}

declare namespace ussd_session_fetchRest {
  
  
}

declare namespace ussd_session_getRest {
  
  
}

declare namespace ussd_session_removeRest {
  
  
}

import ut from 'ut-run';
export interface ports<location = ''> {

}
interface methods extends ports {}

export interface handlers<location = ''> {
  'ussd.config.get'?: ut.handler<ussd_config_get.params, ussd_config_get.result, location>,
  ussdConfigGet?: ut.handler<ussd_config_get.params, ussd_config_get.result, location>,
  'ussd.config.getRest'?: ut.handler<ussd_config_getRest.params, ussd_config_getRest.result, location>,
  ussdConfigGetRest?: ut.handler<ussd_config_getRest.params, ussd_config_getRest.result, location>,
  'ussd.message.process'?: ut.handler<ussd_message_process.params, ussd_message_process.result, location>,
  ussdMessageProcess?: ut.handler<ussd_message_process.params, ussd_message_process.result, location>,
  'ussd.message.processRest'?: ut.handler<ussd_message_processRest.params, ussd_message_processRest.result, location>,
  ussdMessageProcessRest?: ut.handler<ussd_message_processRest.params, ussd_message_processRest.result, location>,
  'ussd.session.fetchRest'?: ut.handler<ussd_session_fetchRest.params, ussd_session_fetchRest.result, location>,
  ussdSessionFetchRest?: ut.handler<ussd_session_fetchRest.params, ussd_session_fetchRest.result, location>,
  'ussd.session.getRest'?: ut.handler<ussd_session_getRest.params, ussd_session_getRest.result, location>,
  ussdSessionGetRest?: ut.handler<ussd_session_getRest.params, ussd_session_getRest.result, location>,
  'ussd.session.removeRest'?: ut.handler<ussd_session_removeRest.params, ussd_session_removeRest.result, location>,
  ussdSessionRemoveRest?: ut.handler<ussd_session_removeRest.params, ussd_session_removeRest.result, location>
}

export interface errors {

}


export type libFactory = ut.libFactory<methods, errors>
export type handlerFactory = ut.handlerFactory<methods, errors, handlers<'local'>>
export type handlerSet = ut.handlerSet<methods, errors, handlers<'local'>>

import portal from 'ut-portal/handlers'
export type pageFactory = portal.pageFactory<methods, errors>
export type pageSet = portal.pageSet<methods, errors>
