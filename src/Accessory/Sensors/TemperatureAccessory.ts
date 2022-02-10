import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../../platform';
import { EventEmitter } from 'events';

export class TemperatureSensorAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'TemperatureSensor';
  private eventSensorStateMsg = 'eventCurrentTemperature';
  private getSensorStateMsg = 'getCurrentTemperature';

  private States = {
    CurrentTemperature: 0,
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
    this.service = this.accessory.getService(this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getSensorState.bind(this));               // GET - bind to the `getOn` method below
  }

  async getSensorState(): Promise<CharacteristicValue> {
    const CurrentTemperature = this.States.CurrentTemperature;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get CurrentTemperature From Homekit -> ${CurrentTemperature}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getSensorStateMsg}:*`);
    return CurrentTemperature;
  }

  async eventSensorStateMsgEvent(value: number) {
    this.States.CurrentTemperature = value;
    // eslint-disable-next-line max-len
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get CurrentTemperature By Crestron Processor -> ${this.States.CurrentTemperature}`);

    this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.States.CurrentTemperature);

  }
}
