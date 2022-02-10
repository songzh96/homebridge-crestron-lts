import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../../platform';
import { EventEmitter } from 'events';

export class SmokeSensorAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'SmokeSensor';
  private eventSensorStateMsg = 'eventSensorState';
  private getSensorStateMsg = 'getSensorState';

  private States = {
    SensorState: false,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventSensorStateMsg}`, this.eventSensorStateMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    // eslint-disable-next-line max-len
    this.service = this.accessory.getService(this.platform.Service.SmokeSensor) || this.accessory.addService(this.platform.Service.SmokeSensor);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.SmokeDetected)
      .onGet(this.getSensorState.bind(this));               // GET - bind to the `getOn` method below
  }

  async getSensorState(): Promise<CharacteristicValue> {
    const isDected = this.States.SensorState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get SensorState From Homekit -> ${isDected}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getSensorStateMsg}:*`);
    return isDected;
  }

  async eventSensorStateMsgEvent(value: number) {

    this.States.SensorState = (value === 1) ? true : false;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Set SensorState By Crestron Processor -> ${this.States.SensorState}`);

    this.service.updateCharacteristic(this.platform.Characteristic.SmokeDetected, this.States.SensorState);

  }
}
