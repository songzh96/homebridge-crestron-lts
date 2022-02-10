import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class ValveAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'Valve';
  private eventPowerStateMsg = 'eventPowerState';
  private setPowerStateMsg = 'setPowerState';
  private getPowerStateMsg = 'getPowerState';

  private States = {
    Active: false,
    InUse: false,
    ValveType:1,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventPowerStateMsg}`, this.eventValveStateMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    this.service = this.accessory.getService(this.platform.Service.Valve) || this.accessory.addService(this.platform.Service.Valve);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.setCharacteristic(this.platform.Characteristic.ValveType, this.States.ValveType);
    this.service.getCharacteristic(this.platform.Characteristic.InUse);
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below
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

  async eventValveStateMsgEvent(value: number) {
    const tmpValue = (value === 1) ? true : false;

    if (this.States.Active !== tmpValue) {
      this.States.Active = tmpValue;
      this.States.InUse = tmpValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Event On By Crestron Processor -> ${this.States.Active}`);
      this.service.updateCharacteristic(this.platform.Characteristic.Active, this.States.Active);
      await this.platform.sleep(1000);
      this.service.updateCharacteristic(this.platform.Characteristic.InUse, this.States.InUse);
    }
  }
}
