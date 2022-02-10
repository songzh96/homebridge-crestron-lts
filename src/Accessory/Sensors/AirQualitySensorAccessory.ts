import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../../platform';
import { EventEmitter } from 'events';

export class AirQualitySensorAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'AirQualitySensor';
  private eventSensorStateMsg = 'eventSensorState';
  private getSensorStateMsg = 'getSensorState';
  private eventVocLevelMsg = 'eventVocLevel';
  private getVocLevelMsg = 'getVocLevel';

  private States = {
    SensorState: 0,
    VocLevel: 0,
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
    this.service = this.accessory.getService(this.platform.Service.AirQualitySensor) || this.accessory.addService(this.platform.Service.AirQualitySensor);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.AirQuality)
      .onGet(this.getSensorState.bind(this));               // GET - bind to the `getOn` method below
    if (accessory.context.device.voc === true) {
      this.service.addCharacteristic(this.platform.Characteristic.VOCDensity)
        .onGet(this.getVocLevel.bind(this));
      this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventVocLevelMsg}`, this.eventVocLevelMsgMsgEvent.bind(this));

    }else{
      this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.VOCDensity));
    }
    // GET - bind to the `getOn` method below
  }

  async getSensorState(): Promise<CharacteristicValue> {
    const AirQuality = this.States.SensorState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get SensorState From Homekit -> ${AirQuality}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getSensorStateMsg}:*`);
    return AirQuality;
  }

  async getVocLevel(): Promise<CharacteristicValue> {
    const VocLevel = this.States.VocLevel;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get VocLevel From Homekit -> ${VocLevel}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getVocLevelMsg}:*`);
    return VocLevel;
  }

  async eventSensorStateMsgEvent(value: number) {
    this.States.SensorState = value;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Set SensorState By Crestron Processor -> ${this.States.SensorState}`);

    this.service.updateCharacteristic(this.platform.Characteristic.AirQuality, this.States.SensorState);

  }

  async eventVocLevelMsgMsgEvent(value: number) {
    this.States.VocLevel = value;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Set VocLevel By Crestron Processor -> ${this.States.VocLevel}`);

    this.service.updateCharacteristic(this.platform.Characteristic.VOCDensity, this.States.VocLevel);

  }
}
