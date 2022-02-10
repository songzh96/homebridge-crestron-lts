/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class AirPurifierAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'AirPurifier';
  private eventPowerStateMsg = 'eventPowerState';
  private setPowerStateMsg = 'setPowerState';
  private getPowerStateMsg = 'getPowerState';
  private eventFanSpeedMsg = 'eventFanSpeed';
  private setFanSpeedMsg = 'setFanSpeed';
  private getFanSpeedMsg = 'getFanSpeed';
  private eventModeStateMsg = 'eventModeState';
  private setModeStateMsg = 'setModeState';
  private getModeStateMsg = 'getModeState';
  private eventFilterLifeLevelMsg = 'eventFilterLifeLevel';
  private getFilterLifeLevelMsg = 'getFilterLifeLevel';

  private States = {
    CurrentState: 0,
    TargetState: 0,
    Speed: 0,
    LifeLevel: 0,
    Active: false,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventPowerStateMsg}`, this.eventPowerStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventModeStateMsg}`, this.eventStateStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventFanSpeedMsg}`, this.eventSpeedMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventFilterLifeLevelMsg}`, this.eventLifeLevelMsgEvent.bind(this));

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');
    this.service = this.accessory.getService(this.platform.Service.AirPurifier) || this.accessory.addService(this.platform.Service.AirPurifier);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState);
    this.service.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
      .onSet(this.setState.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getState.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .onSet(this.setSpeed.bind(this))      // SET - bind to the 'setSpeed` method below
      .onGet(this.getSpeed.bind(this));// SET - bind to the `setOn` method below
    this.service.getCharacteristic(this.platform.Characteristic.FilterChangeIndication);
    this.service.getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
      .onGet(this.getFilterLifeLevel.bind(this));// SET - bind to the `setOn` method below
  }

  async setOn(value: CharacteristicValue) {

    const tmpValue = value as boolean;
    let setValue = 0;
    if (this.States.Active !== tmpValue) {
      this.States.Active = tmpValue;
      setValue = this.States.Active ? 1 : 0;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setPowerStateMsg}:${setValue}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Active By Homekit -> ${this.States.Active}`);
    }
  }

  async getOn(): Promise<CharacteristicValue> {

    const isOn = this.States.Active;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Active From Homekit -> ${isOn}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getPowerStateMsg}:*`);
    return isOn;
  }

  async setState(value: CharacteristicValue) {
    const tmpValue = value as number;
    if (this.States.TargetState !== tmpValue) {
      this.States.TargetState = tmpValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setModeStateMsg}:${this.States.TargetState}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set TargetState By Homekit -> ${this.States.TargetState}`);
    }
  }

  async getState(): Promise<CharacteristicValue> {

    const State = this.States.TargetState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get TargetState From Homekit -> ${State}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getModeStateMsg}:*`);
    return State;
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

  async getSpeed(): Promise<CharacteristicValue> {
    const speed = this.States.Speed;

    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Speed From Homekit -> ${speed}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getFanSpeedMsg}:*`);

    return speed;
  }

  //crestron -> homekit get
  async getFilterLifeLevel(): Promise<CharacteristicValue> {
    const LifeLevel = this.States.LifeLevel;

    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Speed From Homekit -> ${LifeLevel}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getFilterLifeLevelMsg}:*`);

    return LifeLevel;
  }



  async eventPowerStateMsgEvent(value: number) {
    const tmpValue = (value === 1) ? true : false;

    if (this.States.Active !== tmpValue) {
      this.States.Active = tmpValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event On By Crestron Processor -> ${this.States.Active}`);
      this.service.updateCharacteristic(this.platform.Characteristic.Active, this.States.Active);
      if (tmpValue === true) {
        this.States.CurrentState = 2;
      }else if(tmpValue === false) {
        this.States.CurrentState = 0;
      }
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentAirPurifierState, this.States.CurrentState);
    }
  }

  async eventStateStateMsgEvent(value: number) {
    const tmpValue = value;
    if (this.States.CurrentState !== tmpValue) {
      this.States.CurrentState = tmpValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event CurrentState By Crestron Processor -> ${this.States.CurrentState}`);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetAirPurifierState, this.States.TargetState);
    }
  }

  async eventSpeedMsgEvent(value: number) {
    const tmpSpeedValue = value;
    if (this.States.Speed !== tmpSpeedValue) {
      this.States.Speed = tmpSpeedValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Speed By Crestron Processor -> ${this.States.Speed}`);

      this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.States.Speed);
    }
  }

  async eventLifeLevelMsgEvent(value: number) {
    this.States.LifeLevel = value;
    this.platform.log.debug(`${this.deviceType}:${this.id}: event LifeLevel By Crestron Processor -> ${this.States.LifeLevel}`);
    this.service.updateCharacteristic(this.platform.Characteristic.FilterLifeLevel, this.States.LifeLevel);
    if (value < 10 && value >= 0) {
      this.service.updateCharacteristic(this.platform.Characteristic.FilterChangeIndication, 1);
    } else if (value <= 100 && value > 10) {
      this.service.updateCharacteristic(this.platform.Characteristic.FilterChangeIndication, 0);
    }
  }
}
