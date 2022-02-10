import { Service, PlatformAccessory } from 'homebridge';

import { HomebridgePlatform } from '../platform';
import { EventEmitter } from 'events';

export class ProgrammableSwitchAccessory {
  private service: Service;
  private id: number;
  private deviceType = 'Switch';
  private eventSwitchStateMsg = 'eventSwitchState';

  private States = {
    switchEvent: 0,
  };

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventSwitchStateMsg}`, this.eventSwitchStateMsgEvent.bind(this));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KOMEN SMART')
      .setCharacteristic(this.platform.Characteristic.Model, this.deviceType + this.id)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'abcde');

    // eslint-disable-next-line max-len
    this.service = this.accessory.getService(this.platform.Service.StatelessProgrammableSwitch) || this.accessory.addService(this.platform.Service.StatelessProgrammableSwitch);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent);
  }

  async eventSwitchStateMsgEvent(value: number) {
    this.States.switchEvent = value;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Event On By Crestron Processor -> ${this.States.switchEvent}`);
    this.service.updateCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent, this.States.switchEvent);
  }
}
