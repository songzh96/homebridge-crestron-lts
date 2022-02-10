/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HomebridgePlatform } from '../platform';

import { EventEmitter } from 'events';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ThermostatAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'Thermostat';
  private getModeStateMsg = 'getCurrentThermostatState';
  private setModeStateMsg = 'setTargetThermostatState';
  private eventModeStateMsg = 'eventTargetThermostatState';
  private eventCurrentTempMsg = 'eventCurrentTemperature';
  private getCurrentTempMsg = 'getCurrentTemperature';
  private eventTargetTempMsg = 'eventTargetTemperature';
  private setTargetTempMsg = 'setTargetTemperature';
  private getTargetTempMsg = 'getTargetTemperature';

  private States = {
    CurrentState: 0,
    TargetState: 0,
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
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventModeStateMsg}`, this.eventTargetThermostatStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventCurrentTempMsg}`, this.eventCurrentTemperatureMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventTargetTempMsg}`, this.eventTargetTemperatureMsgEvent.bind(this));
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
          .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
          .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');
        this.service = this.accessory.getService(this.platform.Service.Thermostat) || this.accessory.addService(this.platform.Service.Thermostat);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
        this.service.getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState);
        this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
          .setProps({
            validValues: [0, 1, 2],
          })
          .onGet(this.getTargetThermostatState.bind(this))
          .onSet(this.setTargetThermostatState.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
          .onGet(this.getCurrentTemperature.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
          .setProps({
            minValue: this.States.minTemperature,
            maxValue: this.States.maxTemperature,
          })
          .onGet(this.getTargetTemperature.bind(this))
          .onSet(this.setTargetTemperature.bind(this));
  }

  async setTargetThermostatState(value: CharacteristicValue) {
    const tmpValue = value as number;
    if (this.States.TargetState !== tmpValue) {
      this.States.TargetState = tmpValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setModeStateMsg}:${this.States.TargetState}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set TargetState By Homekit -> ${this.States.TargetState}`);
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, this.States.TargetState);
    }
  }

  async getTargetThermostatState(): Promise<CharacteristicValue> {
    const State = this.States.CurrentState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get CurrentState From Homekit -> ${State}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getModeStateMsg}:*`);
    return State;
  }

  async setTargetTemperature(value: CharacteristicValue) {
    const tmpTemperature = value as number;
    if (this.States.TargetTemperature !== tmpTemperature) {
      this.States.TargetTemperature = tmpTemperature;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setTargetTempMsg}:${tmpTemperature}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic HeatingThresholdTemperature By Homekit -> ${tmpTemperature}`);
    }
  }

  async getTargetTemperature(): Promise<CharacteristicValue> {
    const targetTemperature = this.States.TargetTemperature;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic CoolingThresholdTemperature From Homekit -> ${targetTemperature}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getTargetTempMsg}:*`);
    return targetTemperature;
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    const currentTemperature = this.States.CurrentTemperature;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic CurrentTemperature From Homekit -> ${currentTemperature}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getCurrentTempMsg}:*`);
    return currentTemperature;
  }

  async eventTargetThermostatStateMsgEvent(value: number) {
    const tmpTargetThermostatState = value;
    this.States.TargetState = tmpTargetThermostatState;
    this.States.CurrentState = tmpTargetThermostatState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic TargetThermostatState By Crestron Processor -> $(this.States.TargetThermostatState}`);
    this.service.updateCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, this.States.TargetState);
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, this.States.CurrentState);
  }

  async eventTargetTemperatureMsgEvent(value: number) {
    const tmpTargetTemperature = value;
    if (this.States.TargetTemperature !== tmpTargetTemperature) {
      this.States.TargetTemperature = tmpTargetTemperature;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic TargetTemperature By Crestron Processor -> ${tmpTargetTemperature}`);
      this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, this.States.TargetTemperature);
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
}