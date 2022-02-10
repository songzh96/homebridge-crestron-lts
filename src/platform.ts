import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { EventEmitter } from 'events';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { AirPurifierAccessory } from './Accessory/AirPurifierAccessory';
import { LightAccessory } from './Accessory/LightAccessory';
import { DimLightAccessory } from './Accessory/DimLightAccessory';
import { CTLightAccessory } from './Accessory/CTLightAccessory';
import { HueLightAccessory } from './Accessory/HueLightAccessory';
import { SwitchAccessory } from './Accessory/SwitchAccessory';
import { ProgrammableSwitchAccessory } from './Accessory/StatelessProgrammableSwitchAccessory';
import { OutletAccessory } from './Accessory/OutletAccessory';
import { FaucetAccessory } from './Accessory/FaucetAccessory';
import { ValveAccessory } from './Accessory/ValveAccessory';
import { LockAccessory } from './Accessory/LockAccessory';
import { FanAccessory } from './Accessory/FanAccessory';
import { WindowCoveringAccessory } from './Accessory/WindowCoveringAccessory';
import { WindowAccessory } from './Accessory/WindowAccessory';
import { DoorAccessory } from './Accessory/DoorAccessory';
import { GarageDoorAccessory } from './Accessory/GarageDoorAccessory';
import { HeaterCoolerAccessory } from './Accessory/HeaterCoolerAccessory';
import { HeaterAccessory } from './Accessory/HeaterAccessory';
import { ThermostatAccessory } from './Accessory/ThermostatAccessory';
import { HumidifierDehumidifierAccessory } from './Accessory/HumidifierDehumidifierAccessory';
import { SecuritySystemAccessory } from './Accessory/SecuritySystemAccessory';
import { TelevisionAccessory } from './Accessory/TelevisionAccessory';

import { AirQualitySensorAccessory } from './Accessory/Sensors/AirQualitySensorAccessory';
import { CarbonDioxideSensorAccessory } from './Accessory/Sensors/CarbonDioxideAccessory';
import { CarbonMonoxideSensorAccessory } from './Accessory/Sensors/CarbonMonoxideAccessory';
import { ContactSensorAccessory } from './Accessory/Sensors/ContactAccessory';
import { HumiditySensorAccessory } from './Accessory/Sensors/HumidityAccessory';
import { LeakSensorAccessory } from './Accessory/Sensors/LeakAccessory';
import { LightSensorAccessory } from './Accessory/Sensors/LightSensorAccessory';
import { MotionSensorAccessory } from './Accessory/Sensors/MotionAccessory';
import { OccupancySensorAccessory } from './Accessory/Sensors/OccupancyAccessory';
import { SmokeSensorAccessory } from './Accessory/Sensors/SmokeAccessory';
import { TemperatureSensorAccessory } from './Accessory/Sensors/TemperatureAccessory';
import { CrestronSocket } from './crestronSocket';
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  private cresKit!: CrestronSocket;
  private activeIds: string[] = [];
  eventEmitter!: EventEmitter;
  public openGetStatus = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);
    this.eventEmitter = new EventEmitter();
    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
     * 等待指定的时间
     * @param ms
     */
  async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('');
      }, ms);
    });
  }


  handleData(data: string) {
    const msgArr = data.toString().split('*');
    for (const msg of msgArr) {
      const msgDataArr = msg.toString().split(':');
      if (msgDataArr[0].trim() !== '') {
        this.log.debug(`received data from crestron: ${msgDataArr}`);
        const emitMsg = `${msgDataArr[0]}:${msgDataArr[1]}:${msgDataArr[2]}`;
        //this.log.info(`emit message: ${emitMsg}`);
        this.eventEmitter.emit(emitMsg, parseInt(msgDataArr[3]));
      }
    }
  }

  sendData(data: string) {
    this.log.debug(`send data to crestron: ${data}`);
    this.cresKit.writeData(data);
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);

  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    const configAirPurifiers = this.config['AirPurifier'];
    const configSwitchLights = this.config['Lightbulb'];
    const configDimLights = this.config['DimLightbulb'];
    const configCTLights = this.config['CTLightbulb'];
    const configHueLights = this.config['HueLightbulb'];
    const configSwitchs = this.config['Switch'];
    const configProgrammableSwitchs = this.config['ProgrammableSwitch'];
    const configOutlets = this.config['Outlet'];
    const configFaucets = this.config['Faucet'];
    const configValves = this.config['Valve'];
    const configLocks = this.config['Lock'];
    const configFans = this.config['Fan'];
    const configWindowCoverings = this.config['WindowCovering'];
    const configWindows = this.config['Window'];
    const configDoors = this.config['Door'];
    const configGarageDoors = this.config['GarageDoor'];
    const configHeaterCoolers = this.config['HeaterCooler'];
    const configHeaters = this.config['Heater'];
    const configThermostats = this.config['Thermostat'];
    const configHumidifierDehumidifiers = this.config['HumidifierDehumidifier'];
    const configSecuritySystems = this.config['SecuritySystem'];
    const configTelevisions = this.config['Television'];
    const configAirQSensors = this.config['AirQualitySensor'];
    const configCarbonDioxideSensors = this.config['CarbonDioxideSensor'];
    const configCarbonMonoxideSensors = this.config['CarbonMonoxideSensor'];
    const configContactSensors = this.config['ContactSensor'];
    const configHumiditySensors = this.config['HumiditySensor'];
    const configLeakSensors = this.config['LeakSensor'];
    const configLightSensors = this.config['LightSensor'];
    const configMotionSensors = this.config['MotionSensor'];
    const configOccupancySensors = this.config['OccupancySensor'];
    const configTemperatureSensors = this.config['TemperatureSensor'];

    this.registerDevices(configAirPurifiers, 'AirPurifier');
    this.registerDevices(configSwitchLights, 'Lightbulb');
    this.registerDevices(configDimLights, 'DimLightbulb');
    this.registerDevices(configCTLights, 'CTLightbulb');
    this.registerDevices(configHueLights, 'HueLightbulb');
    this.registerDevices(configSwitchs, 'Switch');
    this.registerDevices(configProgrammableSwitchs, 'ProgrammableSwitch');
    this.registerDevices(configOutlets, 'Outlet');
    this.registerDevices(configFaucets, 'Faucet');
    this.registerDevices(configValves, 'Valve');
    this.registerDevices(configLocks, 'Lock');
    this.registerDevices(configFans, 'Fan');
    this.registerDevices(configWindowCoverings, 'WindowCovering');
    this.registerDevices(configWindows, 'Window');
    this.registerDevices(configDoors, 'Door');
    this.registerDevices(configGarageDoors, 'GarageDoor');
    this.registerDevices(configHeaterCoolers, 'HeaterCooler');
    this.registerDevices(configHeaters, 'Heater');
    this.registerDevices(configThermostats, 'Thermostat');
    this.registerDevices(configHumidifierDehumidifiers, 'HumidifierDehumidifier');
    this.registerDevices(configSecuritySystems, 'SecuritySystem');
    this.registerDevices(configTelevisions, 'Television');
    this.registerDevices(configAirQSensors, 'AirQualitySensor');
    this.registerDevices(configCarbonDioxideSensors, 'CarbonDioxideSensor');
    this.registerDevices(configCarbonMonoxideSensors, 'CarbonMonoxideSensor');
    this.registerDevices(configContactSensors, 'ContactSensor');
    this.registerDevices(configHumiditySensors, 'HumiditySensor');
    this.registerDevices(configLeakSensors, 'LeakSensor');
    this.registerDevices(configLightSensors, 'LightSensor');
    this.registerDevices(configMotionSensors, 'MotionSensor');
    this.registerDevices(configOccupancySensors, 'OccupancySensor');
    this.registerDevices(configTemperatureSensors, 'TemperatureSensor');

    // 删除未使用的配件
    this.accessories
      .filter((value) => !this.activeIds.find((id: string) => id === value.UUID))
      .map(accessory => {
        this.log.info('Deleting accessory ' + accessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      });

    this.log.info('                                                              ');
    this.log.info('**************************************************************');
    this.log.info('           homebridge-crestron v-' + '1.0.0' + ' By songzh96');
    this.log.info('  GitHub: https://github.com/songzh96/homebridge-crestron-ts  ');
    this.log.info('                                         QQ Group: 107927710  ');
    this.log.info('**************************************************************');
    this.log.info('                                                              ');

    this.cresKit = new CrestronSocket(this.config['port'], this.config['host'], this);
  }

  registerDevices(configDevices, deviceType: string) {
    if (configDevices !== undefined) {
      for (const device of configDevices) {

        // generate a unique id for the accessory this should be generated from
        // something globally unique, but constant, for example, the device serial
        //如果更改了config中的id，会重新生成一个uuid，设备的缓存也会被删除，分配的房间也会被重新分配到桥接的房间
        //如果没有在手机端改名的话，可以在config改名并且自动进行更新
        const uuid = this.api.hap.uuid.generate(deviceType + device.id.toString());

        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {
          // the accessory already exists
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          existingAccessory.context.device = device;
          existingAccessory.displayName = device.name;
          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          switch (deviceType) {
            case 'AirPurifier':
            {
              new AirPurifierAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Lightbulb':
            {
              new LightAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'DimLightbulb':
            {
              new DimLightAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'CTLightbulb':
            {
              new CTLightAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'HueLightbulb':
            {
              new HueLightAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Switch':
            {
              new SwitchAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'ProgrammableSwitch':
            {
              new ProgrammableSwitchAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Outlet':
            {
              new OutletAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Faucet':
            {
              new FaucetAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Valve':
            {
              new ValveAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Lock':
            {
              new LockAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Fan':
            {
              new FanAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'WindowCovering':
            {
              new WindowCoveringAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Window':
            {
              new WindowAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Door':
            {
              new DoorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'GarageDoor':
            {
              new GarageDoorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'HeaterCooler':
            {
              new HeaterCoolerAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Heater':
            {
              new HeaterAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Thermostat':
            {
              new ThermostatAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'HumidifierDehumidifier':
            {
              new HumidifierDehumidifierAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'SecuritySystem':
            {
              new SecuritySystemAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'Television':
            {
              new TelevisionAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'AirQualitySensor':
            {
              new AirQualitySensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'CarbonDioxideSensor':
            {
              new CarbonDioxideSensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'CarbonMonoxideSensor':
            {
              new CarbonMonoxideSensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'ContactSensor':
            {
              new ContactSensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'HumiditySensor':
            {
              new HumiditySensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'LeakSensor':
            {
              new LeakSensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'LightSensor':
            {
              new LightSensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'MotionSensor':
            {
              new MotionSensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'OccupancySensor':
            {
              new OccupancySensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'SmokeSensor':
            {
              new SmokeSensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
            case 'TemperatureSensor':
            {
              new TemperatureSensorAccessory(this, existingAccessory, this.eventEmitter);
              break;
            }
          }
          this.api.updatePlatformAccessories([existingAccessory]);
          this.activeIds.push(uuid);

        } else {
          // the accessory does not yet exist, so we need to create it
          this.log.info(`adding new accessory: ${device.name}`);

          // create a new accessory
          const accessory = new this.api.platformAccessory(device.name, uuid);

          // store a copy of the device object in the `accessory.context`
          // the `context` property can be used to store any data about the accessory you may need
          accessory.context.device = device;

          // create the accessory handler for the newly create accessory
          // this is imported from `platformAccessory.ts`
          switch (deviceType) {
            case 'AirPurifier':
            {
              new AirPurifierAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Lightbulb':
            {
              new LightAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'DimLightbulb':
            {
              new DimLightAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'CTLightbulb':
            {
              new CTLightAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'HueLightbulb':
            {
              new HueLightAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Switch':
            {
              new SwitchAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'ProgrammableSwitch':
            {
              new ProgrammableSwitchAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Outlet':
            {
              new OutletAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Faucet':
            {
              new FaucetAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Valve':
            {
              new ValveAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Lock':
            {
              new LockAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Fan':
            {
              new FanAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'WindowCovering':
            {
              new WindowCoveringAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Window':
            {
              new WindowAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Door':
            {
              new DoorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'GarageDoor':
            {
              new GarageDoorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'HeaterCooler':
            {
              new HeaterCoolerAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Heater':
            {
              new HeaterAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Thermostat':
            {
              new ThermostatAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'HumidifierDehumidifier':
            {
              new HumidifierDehumidifierAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'SecuritySystem':
            {
              new SecuritySystemAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'Television':
            {
              new TelevisionAccessory(this, accessory, this.eventEmitter);
              break;
            }
            //Sensor
            case 'AirQualitySensor':
            {
              new AirQualitySensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'CarbonDioxideSensor':
            {
              new CarbonDioxideSensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'CarbonMonoxideSensor':
            {
              new CarbonMonoxideSensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'ContactSensor':
            {
              new ContactSensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'HumiditySensor':
            {
              new HumiditySensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'LeakSensor':
            {
              new LeakSensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'LightSensor':
            {
              new LightSensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'MotionSensor':
            {
              new MotionSensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'OccupancySensor':
            {
              new OccupancySensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'SmokeSensor':
            {
              new SmokeSensorAccessory(this, accessory, this.eventEmitter);
              break;
            }
            case 'TemperatureSensor':
            {
              new TemperatureSensorAccessory(this, accessory, this.eventEmitter);
              break;
            }

          }
          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          this.activeIds.push(uuid);
        }
      }
    }
  }
}

