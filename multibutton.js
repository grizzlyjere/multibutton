class MultiButtonSwitch extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
    }

    set hass(hass) {
        this._hass = hass;

        this.setActiveButton(hass)
    }

    // Highlights the button which matches the current entity state
    setActiveButton(hass) {
        if (this.config.entity) {
            const entityId = this.config.entity;
            const state = hass.states[entityId];
            const currentBrightness = state.attributes.brightness;

            // Loop through all specified buttons
            var i;
            for (i = 0; i < this.config.buttons.length; i++) {
                
                // Find the button HTML that should have been created
                var id = this.config.baseid + i;
                var elementSearchResults = this.shadowRoot.querySelectorAll("#" + id);
                var evaluateElement = elementSearchResults[0]

                // Default to consider the button a match to current state,
                // unless we determine otherwise
                var isMatch = true;

                // Check if this is a turn_on, turn_off, or other service type
                var actionType = "";
                if (typeof this.config.buttons[i].service != 'undefined') {
                    actionType = this.config.buttons[i].service;
                    //console.log("Action Type: " + actionType);
                    actionType = actionType.replace("turn_", "");
                }

                // If we found the HTML for the button
                if (evaluateElement) {
                    // TODO: Refactor this block. It's way to messy

                    // Remove any active state classes, and reset to inactive
                    evaluateElement.classList.add("multistate-button-inactive");
                    evaluateElement.classList.remove("multistate-button-active");

                    // Check the state (on/off) against the action type
                    if (state.state != actionType) {
                        isMatch = false;
                    // If the button turns it off and the device is off, consider it a match
                    } else if (state.state == "off" && actionType == "off") {
                        isMatch = true;
                    } else {
                        // Compare the service data with the entity date
                        if (this.config.buttons[i].serviceData) {
                            
                            var y;
                            // Check each service data to make sure it matches
                            for (var property in this.config.buttons[i].serviceData[0]) {
                                if (property != "entity_id" && this.config.buttons[i].serviceData[0].hasOwnProperty(property)) {
                                    //     console.log(property);
                                    //     console.log(this.config.buttons[i].serviceData[0][property])
                                    var propertyValue = this.config.buttons[i].serviceData[0][property];
                                    //    console.log(state.attributes);
                                    if (state.attributes[property]) {
                                        //console.log("CURRENT [" + property + "] : " + state.attributes[property]);
                                        //console.log("ELEMENT [" + property + "] : " + propertyValue);

                                        // If we're checking brightness compare a range based on the tolerance
                                        if (property == "brightness") {
                                            //console.log("LOW: " + (propertyValue - this.config.brightnessTolerance))
                                            //console.log("HIGH: " + (propertyValue + this.config.brightnessTolerance)
                                            
                                            if (state.attributes[property] >= (propertyValue - this.config.brightnessTolerance) && state.attributes[property] <= (propertyValue + this.config.brightnessTolerance)) {
                                                //console.log("IN RANGE")
                                                //console.log("isMatch - Inner 1: " + isMatch);
                                            } else {
                                                //console.log("OUT OF RANGE")
                                                isMatch = false;
                                            }
                                        // Otherwise just check if the property state matches
                                        } else if (state.attributes[property] != propertyValue) {
                                            isMatch = false;
                                        }
                                    } else {
                                        isMatch = false;
                                    }
                                }
                            }
                        }
                    }
                    console.log("isMatch: " + isMatch);
                    if (isMatch) {
                        evaluateElement.classList.remove("multistate-button-inactive");
                        evaluateElement.classList.add("multistate-button-active");
                    }

                }
            }
        }
    }

    // Handles the button press event
    onButtonClick(event) {

        // Get the button that was clicked
        var target = event.target || event.srcElement;
        
        // Get the button index which corresponds to the option data
        var selectedIndex = target.attributes.selectedIndex.value;

        // Get the option data for that index
        var optionData = this.getOptionData(selectedIndex);

        // Build the extra data to go with the service call
        var serviceData = {};
        if (optionData.serviceData != null) {
            serviceData = optionData.serviceData[0];
        }

        // Add the entity_id to the service call if specified
        if(this.config.entity)
        {
            serviceData.entity_id = this.config.entity;
        }

        // Call the specified service
        this._hass.callService(this.config.serviceDomain, optionData.service, serviceData);

        // Highlight the pressed button to provide visual feedback
        target.classList.remove("multistate-button-inactive");
        target.classList.add("multistate-button-active");
    }

    // Get the option data (specified in the YAML) for the specified index
    getOptionData(selectedIndex) {
        return this.config.buttons[selectedIndex];
    }


    setConfig(config) {
        // Check for required parameters
        if (!config.serviceDomain) {
            throw new Error('"serviceDomain" not set');
        }

        if (config.serviceDomain != "SCENE" && !config.entity) {
            throw new Error('"entity" Not Set');
        }

        this.config = config;

        // Set default values
        if (this.config.brightnessTolerance == null) {
            this.config.brightnessTolerance = 0;
        }

        // Render the card
        const root = this.shadowRoot;
        if (root.lastChild) {
            root.removeChild(root.lastChild);
        }

        const card = document.createElement('ha-card');
        card.header = this.config.title;
        const shadow = card.attachShadow({
            mode: 'open'
        });
        var content = document.createElement('div');
        content.id = "multistate-card-content";
        content.setAttribute("class", "multistate-card-content");
        const style = document.createElement('style');
        style.textContent = `
          .multistate-button
          {
               border: solid 1px #7a7a7a;
               width: 92%;
               margin: 0px auto 10px auto;
               font-size:  1.8em;
               padding: 10px 5px 10px 5px;
               text-align: center;
          }

          .multistate-button-inactive
          {
               background-color: var(--secondary-background-color);
          }

          .multistate-button-active
          {
               background-color: var(--state-icon-active-color);
          }

          .multistate-card-content
          {
               padding: 10px 0px 10px 0px;
          }

          .header
          {
               margin-bottom: 0px !important;
               padding-bottom: 0px !important;
          }
          `;

        var outputHTML = "";

        this.i = 0;
        // Create each button
        this.config.buttons.forEach(o => {
            const newButton = document.createElement('div');

            var tempButton = "";
            var id = "";

            id = this.config.baseid + this.i;

            // Build the button 
            newButton.id = id;
            newButton.setAttribute("name", id);
            newButton.setAttribute("selectedIndex", this.i);
            newButton.setAttribute("class", "multistate-button");
            newButton.innerHTML = o.Name;


            // Attach the button to the DOM
            content.appendChild(newButton);

            // Create an event listener for the button
            newButton.addEventListener('click', event => {
                this.onButtonClick(event)
            });

            this.i = this.i + 1;

        });

        card.appendChild(content);
        card.appendChild(style);
        root.appendChild(card);
    }



    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        // TODO: Make dynamic
        return 6;
    }
}

customElements.define('multi-button-switch', MultiButtonSwitch);