import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../../platform';
import { EventEmitter } from 'events';

export class HumiditySensorAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'HumiditySensor';
  private eventSensorStateMsg = 'eventCurrentHumidity';
  private getSensorStateMsg = 'getCurrentHumidity';

  private States = {
    CurrentHumidity: 0,
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
    this.service = this.accessory.getService(this.platform.Service.HumiditySensor) || this.accessory.addService(this.platform.Service.HumiditySensor);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(this.getSensorState.bind(this));               // GET - bind to the `getOn` method below
  }

  async getSensorState(): Promise<CharacteristicValue> {
    const HumidityLevel = this.States.CurrentHumidity;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic On From Homekit -> ${HumidityLevel}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getSensorStateMsg}:*`);
    return HumidityLevel;
  }

  async eventSensorStateMsgEvent(value: number) {
    this.States.CurrentHumidity = value;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic On By Crestron Processor -> ${this.States.CurrentHumidity}`);

    this.service.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.States.CurrentHumidity);

  }
}
