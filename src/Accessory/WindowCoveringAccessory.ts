/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class WindowCoveringAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'WindowCovering';
  private eventPositionStateMsg = 'eventCurrentPosition';
  private setPositionStateMsg = 'setTargetPosition';
  private getPositionStateMsg = 'getCurrentPosition';

  private States = {
    CurrentPosition: 0,
    TargetPosition: 0,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventPositionStateMsg}`, this.eventPositionStateMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    this.service = this.accessory.getService(this.platform.Service.WindowCovering) || this.accessory.addService(this.platform.Service.WindowCovering);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.PositionState);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.getCurrentPostion.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onSet(this.setTargetPostion.bind(this));                // SET - bind to the `setOn` method below

  }


  async setTargetPostion(value: CharacteristicValue) {
    const tmpValue = value as number;
    if (this.States.TargetPosition !== tmpValue) {
      this.States.TargetPosition = tmpValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setPositionStateMsg}:${this.States.TargetPosition}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set TargetPosition By Homekit -> ${this.States.TargetPosition}`);
    }
  }

  async getCurrentPostion(): Promise<CharacteristicValue> {

    const Position = this.States.CurrentPosition;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get CurrentPosition From Homekit -> ${Position}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getPositionStateMsg}:*`);
    return Position;
  }

  async eventPositionStateMsgEvent(value: number) {
    const tmpValue = value;
    if (this.States.CurrentPosition !== tmpValue) {
      this.States.CurrentPosition = tmpValue;
      this.States.TargetPosition = tmpValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event CurrentPosition By Crestron Processor -> ${this.States.CurrentPosition}`);
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this.States.CurrentPosition);
      await this.platform.sleep(100);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.States.TargetPosition);
    }
  }
}
