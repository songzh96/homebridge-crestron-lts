/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class GarageDoorAccessory {
  private service: Service;
  private id: number;
  private SerialNumber: string;
  private deviceType = 'GarageDoor';
  private eventStateStateMsg = 'eventTargetState';
  private setStateStateMsg = 'setTargetState';
  private getStateStateMsg = 'getTargetState';

  private States = {
    CurrentState: 1,
    TargetState: 1,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.SerialNumber = accessory.UUID.substring(0, 8);
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventStateStateMsg}`, this.eventGarageDoorStateMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.SerialNumber);

    this.service = this.accessory.getService(this.platform.Service.GarageDoorOpener) || this.accessory.addService(this.platform.Service.GarageDoorOpener);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.ObstructionDetected);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentDoorState);
    this.service.getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .onSet(this.setTargetState.bind(this))               // SET - bind to the `setOn` method below
      .onGet(this.getTargetState.bind(this));
  }


  async setTargetState(value: CharacteristicValue) {
    const tmpValue = value as number;
    if (this.States.TargetState !== tmpValue) {
      this.States.TargetState = tmpValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setStateStateMsg}:${this.States.TargetState}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set TargetState By Homekit -> ${this.States.TargetState}`);
    }
  }

  async getTargetState(): Promise<CharacteristicValue> {
    const State = this.States.TargetState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get TargetState From Homekit -> ${State}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getStateStateMsg}:*`);
    return State;
  }

  async eventGarageDoorStateMsgEvent(value: number) {
    const tmpValue = value;
    this.States.TargetState = tmpValue;
    this.States.CurrentState = tmpValue;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Event DoorState By Crestron Processor -> ${this.States.CurrentState}`);
    this.service.updateCharacteristic(this.platform.Characteristic.TargetDoorState, this.States.TargetState);
    await this.platform.sleep(100);
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentDoorState, this.States.CurrentState);

  }
}
