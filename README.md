<p align="center">
  <img src="img/homebridge-crestron.png" height="200px">  
</p>


<span align="center">

# Homebridge Crestron LTS
[![Downloads](https://img.shields.io/npm/dt/homebridge-crestron-lts)](https://www.npmjs.com/package/homebridge-crestron-lts)
[![Version](https://img.shields.io/npm/v/homebridge-crestron-lts)](https://www.npmjs.com/package/homebridge-crestron-lts)
[![Homebridge Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/hZubhrz)

[![GitHub issues](https://img.shields.io/github/issues/songzh96/homebridge-crestron-lts)](https://github.com/songzh96/homebridge-crestron-lts/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/songzh96/homebridge-crestron-lts)](https://github.com/songzh96/homebridge-crestron-lts/pulls)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen)](https://standardjs.com)
[![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg?style=flat-square)](https://paypal.me/songzh96?locale.x=zh_XC)

</span>

## Homebridge plugin for crestron
Copyright © 2022 Songzh. All rights reserved.

### Introduction
This [Homebridge](https://github.com/homebridge/homebridge) plugin exposes to Apple's [HomeKit](http://www.apple.com/ios/home/) devices (lights, plugs, sensors, switches, ...) and virtual devices on a Crestron professor.
Homebridge Crestron communicates with TCP.

### Supported Homekit Devices

  <img src="img/Accessories.png">

### HARDWARE Prerequisites
1. Raspberry(Or other devices that can install homebridge, such as NAS, Win, MAC...)
2. Crestron Professor(Series 3 and Series 4 mainframes supporting SIMPL programming)

### SOFTWARE Prerequisites
1. install Homebridge [Raspberry OS](https://github.com/homebridge/homebridge/wiki/Install-Homebridge-on-Raspbian)
2. install homebridge-crestron-lts
  <img src="img/homebridge-crestron-lts.png">  
3. Download Crestron macro files on the release page
4. Programming in SIMPL
  <img src="img/simpl.png">  
5. Upload the program to your Crestron professor
6. Configure devices in homebridge
  <img src="img/homebridge-config.png"> 
7. Save config and then restart homebridge
8. Add Device to Homekit
9. Have FUN
  <img src="img/HomeKit.jpg">
