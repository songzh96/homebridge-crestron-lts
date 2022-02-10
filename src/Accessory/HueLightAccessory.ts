/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class HueLightAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'HueLightbulb';
  private eventLightBrightnessMsg = 'eventLightBrightness';
  private setLightBrightnessMsg = 'setLightBrightness';
  private getLightBrightnessMsg = 'getLightBrightness';
  private eventLightHueMsg = 'eventLightHue';
  private setLightHueMsg = 'setLightHue';
  private getLightHueMsg = 'getLightHue';
  private eventLightSaturationMsg = 'eventLightSaturation';
  private setLightSaturationMsg = 'setLightSaturation';
  private getLightSaturationMsg = 'getLightSaturation';

  private States = {
    On: false,
    Brightness: 0,
    Hue: 333,
    Saturation:100,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventLightBrightnessMsg}`, this.eventBrightnessMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventLightHueMsg}`, this.eventHueMsgEvent.bind(this));
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
    this.service.getCharacteristic(this.platform.Characteristic.Hue)
      .onSet(this.setHue.bind(this))      // SET - bind to the 'setBrightness` method below
      .onGet(this.getHue.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.Saturation)
      .onSet(this.setSaturation.bind(this))      // SET - bind to the 'setBrightness` method below
      .onGet(this.getSaturation.bind(this));
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

  async setHue(value: CharacteristicValue) {
    // implement your own code to set the brightness
    const tmpHueValue = value as number;
    if (this.States.Hue !== tmpHueValue) {
      this.States.Hue = tmpHueValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setLightHueMsg}:${this.States.Hue}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Hue By Homekit -> ${this.States.Hue}`);
    }
  }

  //crestron -> homekit get
  async getHue(): Promise<CharacteristicValue> {
    const HueValue = this.States.Hue;

    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getLightHueMsg}:*`);
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Hue From Homekit -> ${HueValue}`);

    return HueValue;
  }

  async setSaturation(value: CharacteristicValue) {
    // implement your own code to set the brightness
    const tmpSaturationValue = value as number;
    if (this.States.Saturation !== tmpSaturationValue) {
      this.States.Saturation = tmpSaturationValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setLightSaturationMsg}:${this.States.Saturation}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Saturation By Homekit -> ${this.States.Saturation}`);
    }
  }

  //crestron -> homekit get
  async getSaturation(): Promise<CharacteristicValue> {
    const SaturationValue = this.States.Saturation;

    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getLightSaturationMsg}:*`);
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Saturation From Homekit -> ${SaturationValue}`);

    return SaturationValue;
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

  async eventHueMsgEvent(value: number) {
    const tmpCTValue_K = value;
    if (this.States.Saturation !== tmpCTValue_K) {
      this.States.Saturation = 1000000 / tmpCTValue_K;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event Hue By Crestron Processor -> ${this.States.Saturation}`);

      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, this.States.Saturation);
    }
  }

}
