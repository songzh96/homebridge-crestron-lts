/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';
export class FanAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'Fan';
  private eventFanSpeedMsg = 'eventFanSpeed';
  private setFanSpeedMsg = 'setFanSpeed';
  private getFanSpeedMsg = 'getFanSpeed';

  private States = {
    On: false,
    Speed: 0,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventFanSpeedMsg}`, this.eventSpeedMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType+this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    this.service = this.accessory.getService(this.platform.Service.Fan) || this.accessory.addService(this.platform.Service.Fan);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))           // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .onSet(this.setSpeed.bind(this))      // SET - bind to the 'setSpeed` method below
      .onGet(this.getSpeed.bind(this));
  }


  async setOn(value: CharacteristicValue) {

    this.States.On = value as boolean;
    if (this.States.On === true && this.States.Speed === 0) {
      this.platform.log.info('this.States.On', this.States.On);
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setFanSpeedMsg}:999:*`);
    } else if (this.States.On === false) {
      this.States.Speed = 0;
      this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.States.Speed);
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setFanSpeedMsg}:${this.States.Speed}:*`);
    }

    this.platform.log.debug(`${this.deviceType}:${this.id}: Set On By Homekit -> ${value}`);
  }

  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.States.On;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get On From Homekit -> ${isOn}`);
    return isOn;
  }

  async setSpeed(value: CharacteristicValue) {
    // implement your own code to set the brightness
    const tmpSpeedValue = value as number;
    this.platform.log.info('tmpSpeedValue:', tmpSpeedValue);
    this.platform.log.info('this.States.Speed:', this.States.Speed);
    if (this.States.Speed !== tmpSpeedValue) {
      this.States.Speed = tmpSpeedValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setFanSpeedMsg}:${this.States.Speed}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Speed By Homekit -> ${this.States.Speed}`);
    }
  }

  //crestron -> homekit get
  async getSpeed(): Promise<CharacteristicValue> {
    const speed = this.States.Speed;

    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Speed From Homekit -> ${speed}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getFanSpeedMsg}:*`);

    return speed;
  }

  //crestron -> homekit event
  async eventSpeedMsgEvent(value: number) {
    const tmpSpeedValue = value;
    if (this.States.Speed !== tmpSpeedValue) {
      this.States.On = (tmpSpeedValue > 0) ? true : false;
      this.States.Speed = tmpSpeedValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Speed By Crestron Processor -> ${this.States.Speed}`);

      this.service.updateCharacteristic(this.platform.Characteristic.On, this.States.On);
      this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.States.Speed);
    }
  }

}
