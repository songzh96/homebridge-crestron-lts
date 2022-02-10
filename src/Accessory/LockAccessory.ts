/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class LockAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'Lock';
  private eventLockStateMsg = 'eventLockState';
  private setLockStateMsg = 'setLockState';
  private getLockStateMsg = 'getLockState';

  private States = {
    LockCurrentState: false,
    LockTargetState:false,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventLockStateMsg}`, this.eventLockStateMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    this.service = this.accessory.getService(this.platform.Service.LockMechanism) || this.accessory.addService(this.platform.Service.LockMechanism);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState);
    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onSet(this.setLockTargetState.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getLockTargetState.bind(this));
  }


  async setLockTargetState(value: CharacteristicValue) {
    const tmpValue = value as boolean;
    let setValue = 0;
    if (this.States.LockTargetState !== tmpValue) {
      this.States.LockTargetState = tmpValue;
      setValue = this.States.LockTargetState ? 1 : 0;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setLockStateMsg}:${setValue}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set LockState By Homekit -> ${this.States.LockTargetState}`);
    }
  }

  async getLockTargetState(): Promise<CharacteristicValue> {

    const isLock = this.States.LockCurrentState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get LockState From Homekit -> ${isLock}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getLockStateMsg}:*`);
    return isLock;
  }

  async eventLockStateMsgEvent(value: number) {
    const tmpValue = (value === 1) ? true : false;

    if (this.States.LockCurrentState !== tmpValue) {
      this.States.LockCurrentState = tmpValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event LockState By Crestron Processor -> ${this.States.LockCurrentState}`);
      this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.States.LockCurrentState);
      this.service.updateCharacteristic(this.platform.Characteristic.LockTargetState, this.States.LockCurrentState);
    }
  }
}
