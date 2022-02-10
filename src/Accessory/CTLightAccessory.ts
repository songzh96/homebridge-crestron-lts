/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';
export class CTLightAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'CTLightbulb';
  private eventLightBrightnessMsg = 'eventLightBrightness';
  private setLightBrightnessMsg = 'setLightBrightness';
  private getLightBrightnessMsg = 'getLightBrightness';
  private eventLightCTMsg = 'eventLightCT';
  private setLightCTMsg = 'setLightCT';
  private getLightCTMsg = 'getLightCT';

  private States = {
    On: false,
    Brightness: 0,
    CT: 333,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventLightBrightnessMsg}`, this.eventBrightnessMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventLightCTMsg}`, this.eventCTMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))           // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))      // SET - bind to the 'setBrightness` method below
      .onGet(this.getBrightness.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature)
      .setProps({
        minValue: 166,
        maxValue: 333,
      })
      .onSet(this.setCT.bind(this))      // SET - bind to the 'setBrightness` method below
      .onGet(this.getCT.bind(this));
  }


  async setOn(value: CharacteristicValue) {

    this.States.On = value as boolean;
    if (this.States.On === true && this.States.Brightness === 0) {
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setLightBrightnessMsg}:999:*`);
    } else if (this.States.On === false) {
      this.States.Brightness = 0;
      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, this.States.Brightness);
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setLightBrightnessMsg}:${this.States.Brightness}:*`);
    }

    this.platform.log.debug(`${this.deviceType}:${this.id}: Set On By Homekit -> ${value}`);
  }

  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.States.On;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get On From Homekit -> ${isOn}`);
    return isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    // implement your own code to set the brightness
    const tmpBrightnessValue = value as number;
    if (this.States.Brightness !== tmpBrightnessValue) {
      this.States.On = (tmpBrightnessValue > 0) ? true : false;
      this.States.Brightness = tmpBrightnessValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setLightBrightnessMsg}:${this.States.Brightness}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Brightness By Homekit -> ${this.States.Brightness}`);
    }
  }

  //crestron -> homekit get
  async getBrightness(): Promise<CharacteristicValue> {
    const brightness = this.States.Brightness;

    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Brightness From Homekit -> ${brightness}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getLightBrightnessMsg}:*`);

    return brightness;
  }

  async setCT(value: CharacteristicValue) {
    // implement your own code to set the brightness
    const tmpCTValue = value as number;
    if (this.States.CT !== tmpCTValue) {
      this.States.CT = tmpCTValue;
      const CTValue_K = Math.round(1000000/tmpCTValue);
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setLightCTMsg}:${CTValue_K}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set ColorTemperature By Homekit -> ${this.States.CT}`);
    }
  }

  //crestron -> homekit get
  async getCT(): Promise<CharacteristicValue> {
    const CTValue = this.States.CT;

    this.platform.log.debug(`${this.deviceType}:${this.id}: Get ColorTemperature From Homekit -> ${CTValue}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getLightCTMsg}:*`);

    return CTValue;
  }

  //crestron -> homekit event
  async eventBrightnessMsgEvent(value: number) {
    const tmpBrightnessValue = value;
    if (this.States.Brightness !== tmpBrightnessValue) {
      this.States.On = (tmpBrightnessValue > 0) ? true : false;
      this.States.Brightness = tmpBrightnessValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event Brightness By Crestron Processor -> ${this.States.Brightness}`);

      this.service.updateCharacteristic(this.platform.Characteristic.On, this.States.On);
      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, this.States.Brightness);
    }
  }

  async eventCTMsgEvent(value: number) {
    const tmpCTValue_K = value;
    if (this.States.CT !== tmpCTValue_K) {
      this.States.CT = Math.round(1000000/tmpCTValue_K);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event ColorTemperature By Crestron Processor -> ${this.States.CT}`);

      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, this.States.CT);
    }
  }

}
