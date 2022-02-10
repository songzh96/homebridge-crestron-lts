/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class HumidifierDehumidifierAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'HumidifierDehumidifier';
  private eventPowerStateMsg = 'eventPowerState';
  private setPowerStateMsg = 'setPowerState';
  private getPowerStateMsg = 'getPowerState';
  private eventModeStateMsg = 'eventModeState';
  private setModeStateMsg = 'setModeState';
  private getModeStateMsg = 'gettModeState';
  private eventHumidityMsg = 'eventCurrentHumidity';
  private getHumidityMsg = 'getCurrentHumidity';
  private eventFilterWaterLevelMsg = 'eventFilterWaterLevel';
  private getFilterWaterLevelMsg = 'getFilterWaterLevel';

  private States = {
    CurrentState: 0,
    TargetState: 0,
    WaterLevel: 0,
    Active: false,
    Humidity: 0,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventPowerStateMsg}`, this.eventPowerStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventModeStateMsg}`, this.eventStateStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventHumidityMsg}`, this.eventHumidityMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventFilterWaterLevelMsg}`, this.eventWaterLevelMsgEvent.bind(this));

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');
    this.service = this.accessory.getService(this.platform.Service.HumidifierDehumidifier) || this.accessory.addService(this.platform.Service.HumidifierDehumidifier);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState);
    this.service.getCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState)
      .onSet(this.setState.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getState.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(this.getHumidity.bind(this));// SET - bind to the `setOn` method below
    this.service.getCharacteristic(this.platform.Characteristic.FilterChangeIndication);
    this.service.getCharacteristic(this.platform.Characteristic.WaterLevel)
      .onGet(this.getWaterLevel.bind(this));// SET - bind to the `setOn` method below
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
      if (this.States.TargetState === 1){
        this.States.CurrentState = 2;
      }else if (this.States.TargetState === 2){
        this.States.CurrentState = 3;
      }else if (this.States.TargetState === 0){
        this.States.CurrentState = 1;
      }else{
        this.States.CurrentState = 0;
      }
    }
  }

  async getState(): Promise<CharacteristicValue> {

    const State = this.States.CurrentState;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get TargetState From Homekit -> ${State}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getModeStateMsg}:*`);
    return State;
  }

  async getHumidity(): Promise<CharacteristicValue> {
    const Humidity = this.States.Humidity;

    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Humidity From Homekit -> ${Humidity}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getHumidityMsg}:*`);

    return Humidity;
  }

  //crestron -> homekit get
  async getWaterLevel(): Promise<CharacteristicValue> {
    const WaterLevel = this.States.WaterLevel;

    this.platform.log.debug(`${this.deviceType}:${this.id}: Get WaterLevel From Homekit -> ${WaterLevel}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getFilterWaterLevelMsg}:*`);

    return WaterLevel;
  }



  async eventPowerStateMsgEvent(value: number) {
    const tmpValue = (value === 1) ? true : false;

    if (this.States.Active !== tmpValue) {
      this.States.Active = tmpValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event On By Crestron Processor -> ${this.States.Active}`);
      this.service.updateCharacteristic(this.platform.Characteristic.Active, this.States.Active);
    }
  }

  eventStateStateMsgEvent(value: number) {
    const tmpValue = value;
    if (this.States.TargetState !== tmpValue) {
      this.States.CurrentState = tmpValue;
      if(tmpValue === 1) {
        this.States.CurrentState = 2;
      } else if (tmpValue === 2){
        this.States.CurrentState = 3;
      } else if (tmpValue === 0){
        this.States.CurrentState = 0;
      }
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event CurrentState By Crestron Processor -> ${this.States.CurrentState}`);
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState, this.States.CurrentState);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState, this.States.TargetState);
    }
  }

  async eventHumidityMsgEvent(value: number) {
    const tmpHumidityValue = value;
    if (this.States.Humidity !== tmpHumidityValue) {
      this.States.Humidity = tmpHumidityValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Speed By Crestron Processor -> ${this.States.Humidity}`);

      this.service.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.States.Humidity);
    }
  }

  async eventWaterLevelMsgEvent(value: number) {
    this.States.WaterLevel = value;
    this.platform.log.debug(`${this.deviceType}:${this.id}: event WaterLevel By Crestron Processor -> ${this.States.WaterLevel}`);
    this.service.updateCharacteristic(this.platform.Characteristic.WaterLevel, this.States.WaterLevel);
  }

}
