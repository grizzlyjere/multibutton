# multiswitch
A custom Home Assistant Lovelace control for displaying multiple buttons in a card (such as various light brightness, fan speeds, or scenes).

Each button will call a home assistant service with the specified data.  If the entity matches the state of the button, it will be highlighted.  It's intended to be very flexible, so configuration is rather advanced.

![multiswitch Example](https://github.com/grizzlyjere/multibutton/blob/master/Example-Lights.png)

## Instructions
1. In the `config/www` directory of Home Assistant, create a directory called `multibutton`
2. Save [multibutton.js](https://github.com/grizzlyjere/multibutton/raw/master/multibutton.js) in this new directory
3. In your `ui-lovelace.yaml` file, add this file to the resources section.  It should look like this:
```
resources:
  - url: /local/multibutton/multibutton.js
    type: js
```
4. Add the card to a view.  The card type will be `custom:multi-button-switch`.  See the examples section below for sample configurations

## Examples

### Light Dim States
![multibutton Example](https://github.com/grizzlyjere/multibutton/blob/master/Example-Lights.png)

In this example, we want to show buttons for Full, Medium, Low, and Off light brightness states

```
- type: custom:multi-button-switch
  title: Livingroom Lights
  entity: light.livingroom_lights
  baseid: customlivingroom
  serviceDomain: light
  brightnessTolerance: 70
  buttons:
  - name: "Full"
    service: "turn_on"
    serviceData:         
     - brightness: 255
  - name: "Medium"
    service: "turn_on"
    serviceData:         
     - brightness: 110
  - name: "Low"
    service: "turn_on"
    serviceData:         
     - brightness: 30
  - name: "Off"
    service: "turn_off"
```

## Base Settings
|Name|Type|Supported Values|Default|Description|
|----|----|-------|-------|-----------|
|type|string|custom:multi-button-switch|None|(Required) Card type|
|title|string|n/a|None|(Required) Card title to display|
|entity|string|n/a|None|(Optional) entity_id for this card|
|baseid|string|n/a|None|(Required) Text to serve as the based for the HTML id of the component|
|serviceDomain|string|(Any Home Assistant Service Domain)|None|(Required) Service domain to call (e.g. light, scene, fan, etc)|
|brightnessTolerance|number|n/a|0|(Optional) Delta from the target brightness to be considered a match.  I have some ZWave lights that don't report their final brightness for some time.  This allows the current state to be highlighted if the value is close, but not exactly what you've specified|
|buttons|object|n/a|None|(Required) See below for the structure of each option|

## Button Values / Definining Buttons
Each item in the buttons section will be rendered as an on-screen button

|Name|Type|Supported Values|Default|Description|
|----|----|-------|-------|-----------|
|Name|string|n/a|None|(Required) Button label|
|service|string|(Any Home Assistant Service)|n/a|(Required) Service to call in the service domain specified previously.  Typically `turn_on` or `turn_off`|
|serviceData|object|n/a|None|(Optional) Any values specified will be included in the service call (such as fan speed, brightness, etc)

## TODO
* Test and add examples for other service types (such as fan control)
* Improved theme support
* Ability to adjust styling from YAML
* Code optimizations
