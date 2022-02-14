/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HomebridgePlatform } from '../platform';

import { EventEmitter } from 'events';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HeaterCoolerAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'HeaterCooler';
  private eventPowerStateMsg = 'eventPowerState';
  private setPowerStateMsg = 'setPowerState';
  private getPowerStateMsg = 'getPowerState';
  private getModeStateMsg = 'getTargetHeaterCoolerState';
  private setModeStateMsg = 'setTargetHeaterCoolerState';
  private eventModeStateMsg = 'eventTargetHeaterCoolerState';
  private eventCurrentTempMsg = 'eventCurrentTemperature';
  private getCurrentTempMsg = 'getCurrentTemperature';
  private eventTargetTempMsg = 'eventTargetTemperature';
  private setTargetTempMsg = 'setTargetTemperature';
  private getTargetTempMsg = 'getTargetTemperature';
  private eventRotationSpeedMsg = 'eventRotationSpeed';
  private setRotationSpeedMsg = 'setRotationSpeed';
  private getRotationSpeedMsg = 'getRotationSpeed';

  private States = {
    Active: false,
    CurrentState: 0,
    TargetState: 0,
    Speed: 0,
    CurrentTemperature: 24,
    TargetTemperature: 24,
    minTemperature:16,
    maxTemperature:32,
  };

  constructor(
        private platform: HomebridgePlatform,
        private accessory: PlatformAccessory,
        private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventPowerStateMsg}`, this.eventPowerStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventModeStateMsg}`, this.eventTargetHeaterCoolerStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventCurrentTempMsg}`, this.eventCurrentTemperatureMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventTargetTempMsg}`, this.eventTargetTemperatureMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventRotationSpeedMsg}`, this.eventRotationSpeedMsgEvent.bind(this));
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
          .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
          .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');
        this.service = this.accessory.getService(this.platform.Service.HeaterCooler) || this.accessory.addService(this.platform.Service.HeaterCooler);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
        this.service.getCharacteristic(this.platform.Characteristic.Active)
          .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
          .onGet(this.getOn.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState);
        this.service.getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
          .onGet(this.getTargetHeaterCoolerState.bind(this))
          .onSet(this.setTargetHeaterCoolerState.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
          .onSet(this.setSpeed.bind(this))
          .onGet(this.getSpeed.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
          .onGet(this.getCurrentTemperature.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
          .setProps({
            minValue: this.States.minTemperature,
            maxValue: this.States.maxTemperature,
            minStep: 1,
          })
          .onGet(this.getTargetTemperature.bind(this))
          .onSet(this.setTargetTemperature.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
          .setProps({
            minValue: this.States.minTemperature,
            maxValue: this.States.maxTemperature,
            minStep: 1,
          })
          .onGet(this.getTargetTemperature.bind(this))
          .onSet(this.setTargetTemperature.bind(this));
  }

  async setOn(value: CharacteristicValue) {
    const tmpValue = value as boolean;
    if (this.States.Active !== tmpValue) {
      this.States.Active = tmpValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setPowerStateMsg}:${tmpValue}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Active By Homekit -> ${this.States.Active}`);
      if (this.States.TargetState === 1){
        this.States.CurrentState = 2;
      }else if (this.States.TargetState === 2){
        this.States.CurrentState = 3;
      }else if (this.States.TargetState === 0){
        this.States.CurrentState = 1;
      }else{
        this.States.CurrentState = 0;
      }
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.States.CurrentState);
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.States.Active;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Active From Homekit -> ${isOn}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getPowerStateMsg}:*`);
    return isOn;
  }

  async setTargetHeaterCoolerState(value: CharacteristicValue) {
    const tmpValue = value as number;
    if (this.States.TargetState !== tmpValue) {
      this.States.TargetState = tmpValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setModeStateMsg}:${this.States.TargetState}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set TargetState By Homekit -> ${this.States.TargetState}`);
      if (this.States.TargetState === 1){
        this.States.CurrentState = 2;
      }else if (this.States.TargetState === 2){
        this.States.CurrentState = 3;
      }else if (this.States.TargetState === 0){
        this.States.CurrentState = 1;
      }else{
        this.States.CurrentState = 0;
      }
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.States.CurrentState);

    }
  }

  async getTargetHeaterCoolerState(): Promise<CharacteristicValue> {
    const ModeState = this.States.TargetState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get CurrentState From Homekit -> ${ModeState}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getModeStateMsg}:*`);
    return ModeState;
  }

  async setTargetTemperature(value: CharacteristicValue) {
    const tmpTemperature = value as number;
    if (this.States.TargetTemperature !== tmpTemperature) {
      this.States.TargetTemperature = tmpTemperature;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setTargetTempMsg}:${tmpTemperature}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic HeatingThresholdTemperature By Homekit -> ${tmpTemperature}`);
      this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, tmpTemperature);
      this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, tmpTemperature);
    }
  }

  async getTargetTemperature(): Promise<CharacteristicValue> {
    const targetTemperature = this.States.TargetTemperature;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic TargetTemperature From Homekit -> ${targetTemperature}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getTargetTempMsg}:*`);
    return targetTemperature;
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    const currentTemperature = this.States.CurrentTemperature;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic CurrentTemperature From Homekit -> ${currentTemperature}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getCurrentTempMsg}:*`);
    return currentTemperature;
  }

  async setSpeed(value: CharacteristicValue) {
    const tmpSpeedValue = value as number;
    if (this.States.Speed !== tmpSpeedValue) {
      this.States.Speed = tmpSpeedValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setRotationSpeedMsg}:${this.States.Speed}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Speed By Homekit -> ${this.States.Speed}`);
    }
  }

  async getSpeed(): Promise<CharacteristicValue> {
    let speed = this.States.Speed;
    //this.platform.log.info('speed: ', speed);
    if(!speed){
      speed = 0;
    }
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Speed From Homekit -> ${speed}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getRotationSpeedMsg}:*`);
    return speed;
  }

  async eventPowerStateMsgEvent(value: number) {
    const tmpActiveValue = value ? true : false;
    if (this.States.Active !== tmpActiveValue) {
      this.States.Active = tmpActiveValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic Active By Crestron Processor -> ${this.States.Active}`);
      this.service.updateCharacteristic(this.platform.Characteristic.Active, this.States.Active);
    }
  }

  async eventTargetHeaterCoolerStateMsgEvent(value: number) {
    const tmpTargetHeaterCoolerState = value;
    if (this.States.TargetState !== tmpTargetHeaterCoolerState) {
      this.States.TargetState = tmpTargetHeaterCoolerState;
      if (tmpTargetHeaterCoolerState === 0) {
        this.States.CurrentState = 1;
      } else if (tmpTargetHeaterCoolerState === 1) {
        this.States.CurrentState = 2;
      } else if (tmpTargetHeaterCoolerState === 2) {
        this.States.CurrentState = 3;
      }
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic TargetHeaterCoolerState By Crestron Processor -> $(this.States.TargetHeaterCoolerState}`);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, this.States.TargetState);
      await this.platform.sleep(100);
      //this.platform.log.info('TargetHeaterCoolerState: ', this.States.TargetState);

      this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.States.CurrentState);

    }
  }

  async eventTargetTemperatureMsgEvent(value: number) {
    const tmpTargetTemperature = value;
    if (this.States.TargetTemperature !== tmpTargetTemperature) {
      this.States.TargetTemperature = tmpTargetTemperature;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic TargetTemperature By Crestron Processor -> ${tmpTargetTemperature}`);
      this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, this.States.TargetTemperature);
      await this.platform.sleep(100);
      //this.platform.log.info('TargetTemperature: ', this.States.Brightness);
      this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, this.States.TargetTemperature);
    }
  }

  async eventCurrentTemperatureMsgEvent(value: number) {
    const tmpCurrentTemperature = value;
    if (this.States.CurrentTemperature !== tmpCurrentTemperature) {
      this.States.CurrentTemperature = tmpCurrentTemperature;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic CurrentTemperature By Crestron Processor -> ${this.States.CurrentTemperature}`);
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.States.CurrentTemperature);
    }
  }

  async eventRotationSpeedMsgEvent(value: number) {
    const tmpRotationSpeed = value;
    if (this.States.Speed !== tmpRotationSpeed) {
      this.States.Speed = tmpRotationSpeed;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Retrieve Characteristic RotationSpeed From Crestron Processor -> ${this.States.Speed}`);
      this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.States.Speed);
    }
  }
}