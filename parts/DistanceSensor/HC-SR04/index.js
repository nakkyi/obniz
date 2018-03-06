var HCSR04 = function() {
  this.keys  = [ "vcc", "triger", "echo", "gnd"];
  this.requiredKeys  = [ "vcc", "triger", "echo"];

  this._unit = "mm";
};

HCSR04.prototype.wired = function(obniz) {
  this.obniz = obniz;

  obniz.setVccGnd(null, this.params.gnd, "5v");

  this.vccIO = obniz.getIO(this.params.vcc);
  this.triger = this.params.triger;
  this.echo = this.params.echo;
};

HCSR04.prototype.measure = async function(callback) {

  this.vccIO.drive("5v");
  this.vccIO.output(true);
  await this.obniz.wait(10);

  var self = this;
  this.obniz.measure.echo({
    io_pulse: this.triger,
    io_echo: this.echo,
    pulse: "positive",
    pulse_width: 0.011,
    measure_edges: 3,
    timeout: 10/340*1000,
    callback: function(edges){
      self.vccIO.output(false);
      var distance = null;
      for (var i=0; i<edges.length-1; i++){ // HCSR04's output of io_echo is initially high when triger is finshed
        if (edges[i].edge === true) {
          distance = (edges[i+1].timing - edges[i].timing) * 1000;
          if (self._unit === "mm") {
            distance = distance / 5.8;
          } else if (self._unit === "inch") {
            distance = distance / 148.0;
          }
        }
      }
      if (typeof(callback) === "function") {
        callback(distance);
      }
    }
  })
};

HCSR04.prototype.unit = function(unit) {
  if (unit === "mm") {
    this._unit = "mm";
  } else if (unit === "inch") {
    this._unit = "inch";
  } else {
    throw new Error("HCSR04: unknown unit "+unit);
  }
};

// Module functions

if (PartsRegistrate) {
  PartsRegistrate("HC-SR04", HCSR04);
}