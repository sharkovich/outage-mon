export class DownLog {
  constructor() {
    this.startTime = new Date();
    this.endTime = null;
    this.duration = undefined;
  }

  finish() {
    this.endTime = new Date();
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
}
