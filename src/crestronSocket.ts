import { Socket } from 'net';
import { HomebridgePlatform } from './platform';

export class CrestronSocket {
  platform: HomebridgePlatform;
  creskitConn: Socket;
  port: number;
  host: string;

  constructor(port: number, host: string, platform: HomebridgePlatform) {
    this.platform = platform;
    this.creskitConn = new Socket();
    this.port = port;
    this.host = host;

    if (this.host !== undefined || this.host !== '') {
      this.creskitConn.on('error', this.connErrorEvent.bind(this));
      this.creskitConn.on('timeout', this.connTimeOutEvent);
      this.creskitConn.on('connect', this.connectedEvent.bind(this));
      this.creskitConn.on('data', this.dataEvent.bind(this));
      this.creskitConn.on('end', this.disconnectedEvent.bind(this));
      this.connectToHost();
    }
  }

  connectToHost() {
    if (this.creskitConn !== undefined) {
      this.platform.log.info(`connect to ${this.host}:${this.port}`);
      this.creskitConn.connect(this.port, this.host);
    }
  }

  connErrorEvent() {
    if (this.creskitConn !== undefined) {
      this.platform.log.info('connection error');
      this.platform.log.info(`reconnect to ${this.host}:${this.port} again`);
      setTimeout(() => {
        this.creskitConn.connect(this.port, this.host);
      }, 2000);
    }
  }

  connTimeOutEvent() {
    this.platform.log.info('connection time out');
  }

  dataEvent(data: string): void {
    if (this.platform !== undefined) {
      this.platform.handleData(data.toString());
    }
  }

  connectedEvent() {
    this.platform.log.info('connected to the host');
  }

  disconnectedEvent() {
    if (this.creskitConn !== undefined) {
      this.platform.log.error('disconnected from the host');
      this.platform.log.info(`reconnect to ${this.host}:${this.port} again`);
      setTimeout(() => {
        this.creskitConn.connect(this.port, this.host);
      }, 2000);
    }
  }

  writeData(data: string) {
    if (this.creskitConn !== undefined) {
      this.creskitConn.write(data);
    }
  }
}