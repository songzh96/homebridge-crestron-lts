import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class OutletAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'Outlet';
  private eventPowerStateMsg = 'eventPowerState';
  private setPowerStateMsg = 'setPowerState';
  private getPowerStateMsg = 'getPowerState';

  private States = {
    On: false,
    InUse:false,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventPowerStateMsg}`, this.eventOutletStateMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    this.service = this.accessory.getService(this.platform.Service.Outlet) || this.accessory.addService(this.platform.Service.Outlet);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.InUse);
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below
  }


  async setOn(value: CharacteristicValue) {

    const tmpValue = value as boolean;
    let setValue = 0;
    if (this.States.On !== tmpValue) {
      this.States.On = tmpValue;
      setValue = this.States.On ? 1 : 0;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setPowerStateMsg}:${setValue}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set On By Homekit -> ${this.States.On}`);
    }
  }

  async getOn(): Promise<CharacteristicValue> {

    const isOn = this.States.On;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get On From Homekit -> ${isOn}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getPowerStateMsg}:*`);
    return isOn;
  }

  async eventOutletStateMsgEvent(value: number) {
    const tmpValue = (value === 1) ? true : false;

    if (this.States.On !== tmpValue) {
      this.States.On = tmpValue;
      this.States.InUse = tmpValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event On By Crestron Processor -> ${this.States.On}`);
      this.service.updateCharacteristic(this.platform.Characteristic.On, this.States.On);
      this.service.updateCharacteristic(this.platform.Characteristic.On, this.States.InUse);
    }
  }
}
