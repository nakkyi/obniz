class WSCommand_PWM extends WSCommand {

  constructor(delegate) {
    super(delegate);
    this.module = 3;
    this.ModuleNum = 6;
    this.resetInternalStatus();

    this._CommandInit     = 0
    this._CommandDeinit   = 1
    this._CommandSetFreq  = 2
    this._CommandSetDuty  = 3
    this._CommandAMModulate = 4
  }

  resetInternalStatus() {
    this.pwms = [];
    for (var i=0; i<this.ModuleNum; i++) {
      this.pwms.push({});
    }
  }

  // Commands

  init(module, io) {
    var buf = new Uint8Array(2);
    buf[0] = module;
    buf[1] = io;
    this.pwms[module].io = io;
    this.sendCommand(this._CommandInit, buf);
  }

  deinit(module) {
    var buf = new Uint8Array(1);
    buf[0] = module;
    this.pwms[module] = {};
    this.sendCommand(this._CommandDeinit, buf);
  }

  setFreq(module, freq) {
    var buf = new Uint8Array(5);
    buf[0] = module;
    buf[1] = freq >> (8*3);
    buf[2] = freq >> (8*2);
    buf[3] = freq >> (8*1);
    buf[4] = freq;
    this.pwms[module].freq = freq;
    this.sendCommand(this._CommandSetFreq, buf);
  }

  setDuty(module, pulseUSec) {
    var buf = new Uint8Array(5);
    buf[0] = module;
    buf[1] = pulseUSec >> (8*3);
    buf[2] = pulseUSec >> (8*2);
    buf[3] = pulseUSec >> (8*1);
    buf[4] = pulseUSec;
    this.pwms[module].pulseUSec = pulseUSec;
    this.sendCommand(this._CommandSetDuty, buf);
  }

  amModulate(module, baud_us, data) {
    var buf = new Uint8Array(5 + data.length);
    buf[0] = module;
    buf[1] = baud_us >> (8*3);
    buf[2] = baud_us >> (8*2);
    buf[3] = baud_us >> (8*1);
    buf[4] = baud_us;
    for (var i=0; i<data.length; i++) {
      buf[5 + i] = data[i];
    }
    this.sendCommand(this._CommandAMModulate, buf);
  }

  parseFromJson(json) {
    for (var i=0; i<this.ModuleNum;i++) {
      var module = json["pwm"+i];
      if (module === null) {
        this.deinit(i);
        continue;
      }
      if (typeof(module) != "object") {
        continue;
      }
      if (typeof(module.io) == "number") {
        if (this.isValidIO(module.io)) {
          this.init(i, module.io);
        } else {
          throw new Error("pwm: invalid io number.");
        }
      }
      if (typeof(module.freq) == "number") {
        var freq = parseInt(module.freq);
        if(isNaN(freq)) {
          throw new Error("pwm: invalid freq value.");
        }
        if (freq < 1 || 80 * 1000 * 1000 < freq)  {
          throw new Error("pwm: freq must be 1<=freq<=80M. your freq is "+module.freq);
        }
        this.setFreq(i, freq);
      }
      if (typeof(module.pulse) === "number") {
        this.setDuty(i, module.pulse * 1000);
      }
      var duty = module.duty;
      if (typeof duty === "number") {
        if (this.pwms[i].freq > 0) { // 0 division not acceptable
          if (duty > 100) duty = 100;
          else if (duty < 0) duty = 0;
          var pulseUSec = 1.0 / this.pwms[i].freq * duty * 0.01 * 1000000;
          pulseUSec = parseInt(pulseUSec);
          this.setDuty(i, pulseUSec);
        }
      }
      if (typeof module.modulate == "object" && module.modulate.type === "am") {
        var baud_usec = parseInt(module.modulate.baud * 1000);
        if(isNaN(baud_usec)) {
          throw new Error("pwm: baud is not number");
        }
        if(baud_usec < 50) {
          throw new Error("pwm: baud should bigger than 50usec");
        }
        if(baud_usec > 1000*1000) {
          throw new Error("pwm: baud should smaller than 1sec");
        }
        this.amModulate(i, baud_usec, module.modulate.data);
      }
    }
  }
}
