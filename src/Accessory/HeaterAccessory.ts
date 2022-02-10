/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HeaterAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'Heater';
  private setPowerStateMsg = 'setPowerState';
  private getPowerStateMsg = 'getPowerState';
  private eventPowerStateMsg = 'eventPowerState';
  private eventTargetTempMsg = 'eventTargetTemperature';
  private setTargetTempMsg = 'setTargetTemperature';
  private getTargetTempMsg = 'getTargetTemperature';
  private eventCurrentTempMsg = 'eventCurrentTemperature';
  private getCurrentTempMsg = 'getCurrentTemperature';

  private States = {
    Active: false,
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
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventCurrentTempMsg}`, this.eventCurrentTemperatureMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventTargetTempMsg}`, this.eventTargetTemperatureMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');
    this.service = this.accessory.getService(this.platform.Service.HeaterCooler) || this.accessory.addService(this.platform.Service.HeaterCooler);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
      .setProps({
        validValues: [0, 2],
      });
    this.service.setCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, 2);
    this.service.getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
      .setProps({
        validValues: [1],
      });
    this.service.setCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, 1);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
      .setProps({
        minValue: this.States.minTemperature,
        maxValue: this.States.maxTemperature,
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
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.States.Active;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Active From Homekit -> ${isOn}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getPowerStateMsg}:*`);
    return isOn;
  }

  async setTargetTemperature(value: CharacteristicValue) {
    const tmpHeatingThresholdTemperature = value as number;
    if (this.States.TargetTemperature !== tmpHeatingThresholdTemperature) {
      this.States.TargetTemperature = tmpHeatingThresholdTemperature;
      this.States.TargetTemperature = tmpHeatingThresholdTemperature;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setTargetTempMsg}:${tmpHeatingThresholdTemperature * 10}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic HeatingThresholdTemperature By Homekit -> ${tmpHeatingThresholdTemperature}`);
      this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, tmpHeatingThresholdTemperature);
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

  async eventPowerStateMsgEvent(value: number) {
    const tmpActiveValue = value ? true : false;
    if (this.States.Active !== tmpActiveValue) {
      this.States.Active = tmpActiveValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic Active By Crestron Processor -> ${this.States.Active}`);
      this.service.updateCharacteristic(this.platform.Characteristic.Active, this.States.Active);
    }
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