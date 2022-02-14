/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';
export class DimLightAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'DimLightbulb';
  private eventLightBrightnessMsg = 'eventLightBrightness';
  private setLightBrightnessMsg = 'setLightBrightness';
  private getLightBrightnessMsg = 'getLightBrightness';

  private States = {
    On: false,
    Brightness: 0,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventLightBrightnessMsg}`, this.eventBrightnessMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType+this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))           // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))      // SET - bind to the 'setBrightness` method below
      .onGet(this.getBrightness.bind(this));
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

  //crestron -> homekit event
  async eventBrightnessMsgEvent(value: number) {
    const tmpBrightnessValue = value;
    if (this.States.Brightness !== tmpBrightnessValue) {

      this.States.On = (tmpBrightnessValue > 0) ? true : false;
      this.States.Brightness = tmpBrightnessValue;
      //this.platform.log.info('this.States.Brightness:', this.States.Brightness);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event Brightness By Crestron Processor -> ${this.States.Brightness}`);

      this.service.updateCharacteristic(this.platform.Characteristic.On, this.States.On);
      await this.platform.sleep(100);
      //this.platform.log.info('Brightness: ', this.States.Brightness);
      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, this.States.Brightness);
    }
  }

}
