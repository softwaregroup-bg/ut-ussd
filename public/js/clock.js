var clock;

(function($){
  function Clock(clockId){
    this.holder = $('#'+clockId);
    this.init();
    this.setTime();
    var self = this;
    this.holder.bind('click', function(){
      if(!self.state)
        self.start();
      else if(self.state == Clock.states.stopped)
        self.resume();
      else
        self.stop();
    });
  };

  Clock.states = {
    stopped: "stopped",
    started: "started"
  }

  Clock.prototype.init = function Clock__init(){
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.separator = ":";
  };

  Clock.prototype.changeState = function changeState(state){
    this.state = state;
  };

  Clock.prototype.setTime = function setTime(){
    this.holder.text(this.getTime());
  };

  Clock.prototype.fixTime = function Clock__fixTime(item){
    return item < 10 ? '0'+item : item;
  };

  Clock.prototype.getTime = function Clock__getTime(){
    if(this.seconds == 60){
        this.seconds = 0;
        this.minutes++;
      }
      if(this.minutes == 60){
        this.minutes = 0;
        this.hours++
      }
      return this.fixTime(this.hours)+
             this.separator+
             this.fixTime(this.minutes)+
             this.separator+
             this.fixTime(this.seconds);
  };

  Clock.prototype.nextTick = function Clock__nextTick(){
    this.setTime();
    this.seconds++;
  };

  Clock.prototype.start = function Clock__start(){
    this.nextTick();
    this.initTimer();
    /*custom code below*/
    /*if(this.state === undefined && typeof fetchRegistrationName === 'function')
      fetchRegistrationName();*/
    /*custom code above*/
    this.changeState(Clock.states.started);
  };

  Clock.prototype.resume = function Clock__resume(){
    var self = this;
    setTimeout(function(){
      self.stop();
      self.start();
    }, 1000);
  };

  Clock.prototype.initTimer = function Clock__initTimer(){
    var self = this;
    this.refreshTime = setInterval(function(){
      self.nextTick();
    }, 1000);
  };

  Clock.prototype.stop = function Clock__stop(deleteState){
    clearInterval(this.refreshTime);
    this.changeState(Clock.states.stopped);
    if(deleteState)
      delete this.state;
  };

  Clock.prototype.restart = function Clock__restart(){
    this.reset();
    this.start();
  };

  Clock.prototype.reset = function Clock__reset(){
    this.stop();
    this.init();
    this.setTime();
    delete this.state;
  };

  $(document).ready(function(){
    clock = new Clock('clock');
  });

})(jQuery);