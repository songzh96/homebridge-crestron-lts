import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../../platform';
import { EventEmitter } from 'events';

export class LightSensorAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'LightSensor';
  private eventSensorStateMsg = 'eventCurrentLightLevel';
  private getSensorStateMsg = 'getCurrentLightLevel';

  private States = {
    LightLevel: 0.001,
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
    this.service = this.accessory.getService(this.platform.Service.LightSensor) || this.accessory.addService(this.platform.Service.LightSensor);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
      .onGet(this.getSensorState.bind(this));               // GET - bind to the `getOn` method below
  }

  async getSensorState(): Promise<CharacteristicValue> {
    const LightLevel = this.States.LightLevel;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get LightLevel From Homekit -> ${LightLevel}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getSensorStateMsg}:*`);
    return LightLevel;
  }

  async eventSensorStateMsgEvent(value: number) {
    this.States.LightLevel = value;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Set LightLevel By Crestron Processor -> ${this.States.LightLevel}`);

    this.service.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, this.States.LightLevel);

  }
}
