/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class SecuritySystemAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'SecuritySystem';
  private eventStateMsg = 'eventCurrentState';
  private setStateMsg = 'setTargetState';
  private getStateMsg = 'getCurrentState';

  private States = {
    CurrentState: 0,
    TargetState: 0,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventStateMsg}`, this.eventSecuritySystemStateMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    this.service = this.accessory.getService(this.platform.Service.SecuritySystem) || this.accessory.addService(this.platform.Service.SecuritySystem);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
      .onGet(this.getCurrentState.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
      .onSet(this.setTargetState.bind(this));                // SET - bind to the `setOn` method below

  }


  async setTargetState(value: CharacteristicValue) {
    const tmpValue = value as number;
    if (this.States.TargetState !== tmpValue) {
      this.States.TargetState = tmpValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setStateMsg}:${this.States.TargetState}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set TargetSecuritySystem By Homekit -> ${this.States.TargetState}`);
    }
  }

  async getCurrentState(): Promise<CharacteristicValue> {
    const SecuritySystem = this.States.CurrentState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get CurrentSecuritySystem From Homekit -> ${SecuritySystem}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getStateMsg}:*`);
    return SecuritySystem;
  }

  async eventSecuritySystemStateMsgEvent(value: number) {
    const tmpValue = value;
    if (this.States.CurrentState !== tmpValue) {
      this.States.CurrentState = tmpValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event CurrentSecuritySystem By Crestron Processor -> ${this.States.CurrentState}`);
      this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState, this.States.CurrentState);
      this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemTargetState, this.States.TargetState);
    }
  }
}
