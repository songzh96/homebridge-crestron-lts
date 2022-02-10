/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgePlatform } from '../platform';

import { EventEmitter } from 'events';

export class TelevisionAccessory {
  private tvService: Service;
  private id: number;
  private deviceType = 'Television';
  private eventPowerStateMsg = 'eventPowerState';
  private setPowerStateMsg = 'setPowerState';
  private getPowerStateMsg = 'getPowerState';
  private eventInputStateMsg = 'eventInputState';
  private setInputStateMsg = 'setInputState';
  private getInputStateMsg = 'getInputState';
  private setRemoteKeyMsg = 'setRemoteKey';
  private eventMuteStateMsg = 'eventMuteState';
  private setMuteStateMsg = 'setMuteState';
  private getMuteStateMsg = 'getMuteState';
  private eventVolumeStateMsg = 'eventVolumeState';
  private setVolumeStateMsg = 'setVolumeState';
  private getVolumeStateMsg = 'getVolumeState';

  /**
      * These are just used to create a working example
      * You should implement your own code to track the state of your accessory
      */
  private states = {
    Active: 0,
    ActiveIdentifier: 0, //Input Selection
    SleepDiscoveryMode: 1,
    Mute: 0,
    Volume: 0,
  };

  tvSpeakerService: Service;

  constructor(
        private platform: HomebridgePlatform,
        private accessory: PlatformAccessory,
        private eventEmitter: EventEmitter,
  ) {
    this.id = accessory.context.device.id;
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventPowerStateMsg}`, this.eventPowerStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventInputStateMsg}`, this.eventInputStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventMuteStateMsg}`, this.eventMuteStateMsgEvent.bind(this));
    this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventVolumeStateMsg}`, this.eventVolumeStateMsgEvent.bind(this));

        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
          .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
          .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

        this.accessory.category = this.platform.api.hap.Categories.TELEVISION;

        // get the Television service if it exists, otherwise create a new Television service
        this.tvService = this.accessory.getService(this.platform.Service.Television) || this.accessory.addService(this.platform.Service.Television);

        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.

        this.tvService.setCharacteristic(this.platform.Characteristic.ConfiguredName, this.accessory.context.device.name);
        this.tvService.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

        this.tvService.getCharacteristic(this.platform.Characteristic.Active)
          .onGet(this.handleActiveGet.bind(this))
          .onSet(this.handleActiveSet.bind(this));

        this.tvService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
          .onGet(this.handleActiveIdentifierGet.bind(this))
          .onSet(this.handleActiveIdentifierSet.bind(this));

        this.tvService.getCharacteristic(this.platform.Characteristic.RemoteKey)
          .onSet(this.handleRemoteKeySet.bind(this));

        this.tvSpeakerService = this.accessory.getService(this.platform.Service.Speaker) || this.accessory.addService(this.platform.Service.Speaker);

        this.tvSpeakerService.setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE);
        this.tvSpeakerService.setCharacteristic(this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);

        this.tvSpeakerService.getCharacteristic(this.platform.Characteristic.Mute)
          .onGet(this.handleMuteGet.bind(this))
          .onSet(this.handleMuteSet.bind(this));

        this.tvSpeakerService.getCharacteristic(this.platform.Characteristic.VolumeSelector)
          .onSet(this.handleVolumeSelectorSet.bind(this));

        this.tvSpeakerService.getCharacteristic(this.platform.Characteristic.Volume)
          .onGet(this.handleVolumeGet.bind(this))
          .onSet(this.handleVolumeSet.bind(this));

        this.tvService.addLinkedService(this.tvSpeakerService);

        const inputs = this.accessory.context.device.inputs;
        const inputsNum = this.accessory.context.device.inputs.length;
        if (inputsNum > 0) {
          inputs.forEach(
            (input: { name: string; type: number }, i: number) => {
              let inputService = this.accessory.getService(input.name + i.toString());
              if (!inputService) {
                inputService = this.accessory.addService(this.platform.Service.InputSource, input.name + i.toString(), input.name + i.toString());
              }
              inputService
                .setCharacteristic(this.platform.Characteristic.Identifier, i)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, input.name)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, input.type)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN);
              this.tvService.addLinkedService(inputService);
            },
          );
        }
  }

  async handleActiveGet(): Promise<CharacteristicValue> {
    const isActive = this.states.Active;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic Active From Homekit -> ${isActive}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getPowerStateMsg}:*`);
    return isActive;
  }

  async handleActiveIdentifierGet(): Promise<CharacteristicValue> {
    const activeIdentifier = this.states.ActiveIdentifier;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic ActiveIdentifier From Homekit -> ${activeIdentifier}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getInputStateMsg}:*`);
    return activeIdentifier;
  }

  async handleSleepDiscoveryModeGet(): Promise<CharacteristicValue> {
    const sleepDiscoveryMode = this.states.SleepDiscoveryMode;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic SleepDiscoveryMode From Homekit -> ${sleepDiscoveryMode}`);
    return sleepDiscoveryMode;
  }

  async handleMuteGet(): Promise<CharacteristicValue> {
    const mute = this.states.Mute;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic Mute From Homekit -> ${mute}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getMuteStateMsg}:*`);
    return mute;
  }

  async handleVolumeGet(): Promise<CharacteristicValue> {
    const volume = this.states.Volume;
    this.platform.log.debug(`${this.deviceType}:${this.id}: Get Characteristic Volume From Homekit -> ${volume}`);
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.getVolumeStateMsg}:*`);
    return volume;
  }

  async handleActiveSet(value: CharacteristicValue) {
    const tmpActiveValue = value as number;
    if (this.states.Active !== tmpActiveValue) {
      this.states.Active = tmpActiveValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setPowerStateMsg}:${this.states.Active}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic Active By Homekit -> ${tmpActiveValue}`);
    }
  }

  async handleActiveIdentifierSet(value: CharacteristicValue) {
    const tmpActiveIdentifierValue = value as number;
    if (this.states.ActiveIdentifier !== tmpActiveIdentifierValue) {
      this.states.ActiveIdentifier = tmpActiveIdentifierValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setInputStateMsg}:${this.states.ActiveIdentifier}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic ActiveIdentifier By Homekit -> ${tmpActiveIdentifierValue}`);
    }
  }

  async handleSleepDiscoveryModeSet(value: CharacteristicValue) {
    const tmpSleepDiscoveryModeValue = value as number;
    if (this.states.SleepDiscoveryMode !== tmpSleepDiscoveryModeValue) {
      this.states.SleepDiscoveryMode = tmpSleepDiscoveryModeValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic SleepDiscoveryMode By Homekit -> ${tmpSleepDiscoveryModeValue}`);
    }
  }

  async handleRemoteKeySet(value: CharacteristicValue) {
    const tmpRemoteKeyValue = value as number;
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.setRemoteKeyMsg}:${tmpRemoteKeyValue}:*`);
    this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic RemoteKey By Homekit -> ${tmpRemoteKeyValue}`);
  }

  async handleMuteSet(value: CharacteristicValue) {
    const tmpMuteValue = value as number;
    if (this.states.Mute !== tmpMuteValue) {
      this.states.Mute = tmpMuteValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setMuteStateMsg}:${this.states.Mute}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic Mute By Homekit -> ${tmpMuteValue}`);
    }
  }

  async handleVolumeSelectorSet(value: CharacteristicValue) {
    const tmpVolumeSelectorValue = value as number;
    if (tmpVolumeSelectorValue === this.platform.Characteristic.VolumeSelector.INCREMENT) {
      if (this.states.Volume + 1 <= 100) {
        this.states.Volume++;
      }
    } else {
      if (this.states.Volume - 1 >= 0) {
        this.states.Volume--;
      }
    }
    this.platform.sendData(`${this.deviceType}:${this.id}:${this.setVolumeStateMsg}:${this.states.Volume}:*`);
    this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic VolumeSelector By Homekit -> ${tmpVolumeSelectorValue}`);
  }

  async handleVolumeSet(value: CharacteristicValue) {
    const tmpVolumeValue = value as number;
    if (this.states.Volume !== tmpVolumeValue) {
      this.states.Volume = tmpVolumeValue;
      this.platform.sendData(`${this.deviceType}:${this.id}:${this.setVolumeStateMsg}:${this.states.Volume}:*`);
      this.platform.log.debug(`${this.deviceType}:${this.id}: Set Characteristic Volume By Homekit -> ${tmpVolumeValue}`);
    }
  }

  async eventPowerStateMsgEvent(value: number) {
    const tmpActiveValue = value;
    if (this.states.Active !== tmpActiveValue) {
      this.states.Active = tmpActiveValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Retrieve Characteristic Active From Crestron Processor -> ${this.states.Active}`);
      this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.states.Active);
    }
  }

  async eventInputStateMsgEvent(value: number) {
    const tmpActiveIdentifierValue = value;
    if (this.states.ActiveIdentifier !== tmpActiveIdentifierValue) {
      this.states.ActiveIdentifier = tmpActiveIdentifierValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Retrieve Characteristic ActiveIdentifier From Crestron Processor -> ${this.states.ActiveIdentifier}`);
      this.tvService.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.states.ActiveIdentifier);
    }
  }

  async eventMuteStateMsgEvent(value: number) {
    const tmpMuteValue = value;
    if (this.states.Mute !== tmpMuteValue) {
      this.states.Mute = tmpMuteValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Retrieve Characteristic Mute From Crestron Processor -> ${this.states.Mute}`);
      this.tvService.updateCharacteristic(this.platform.Characteristic.Mute, this.states.Mute);
    }
  }

  async eventVolumeStateMsgEvent(value: number) {
    const tmpVolumeValue = value;
    if (this.states.Volume !== tmpVolumeValue) {
      this.states.Volume = tmpVolumeValue;
      this.platform.log.debug(`${this.deviceType}:${this.id}: Retrieve Characteristic Volume From Crestron Processor -> ${this.states.Volume}`);
      this.tvService.updateCharacteristic(this.platform.Characteristic.Volume, this.states.Volume);
    }
  }
}