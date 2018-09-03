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

     setActiveButton(hass) {

          const entityId = this.config.entity;
          const state = hass.states[entityId];
          const currentBrightness = state.attributes.brightness;

          var i;
          for (i = 0; i < this.config.options.length; i++) {
               //console.log("i: " + i);
               var id = this.config.baseid + i;
               var elementSearchResults = this.shadowRoot.querySelectorAll("#" + id);
               var evaluateElement = elementSearchResults[0]
               //console.log(evaluateElement);

               var isMatch = true;

               var actionType = "";
               if (typeof this.config.options[i].service != 'undefined') {
                    actionType = this.config.options[i].service;
                    //console.log("Action Type: " + actionType);
                    actionType = actionType.replace("turn_", "");
               }


               if (evaluateElement) {
                    evaluateElement.classList.add("multistate-button-inactive");
                         evaluateElement.classList.remove("multistate-button-active");

                    if (state.state != actionType) {

                         isMatch = false;
                    } 
                    else if(state.state == "off" && actionType == "off")
                    {
                         isMatch = true;
                    }
                    else {
                         //console.log("Element Found");
                         // Set the inactive status and remove any active states.
                         

                         // Compare the service data with the entity date
                         if (this.config.options[i].serviceData) {
                              //console.log("Found Service Data");
                              var y;
                              //console.log(this.config.options[i].serviceData[0]);
                              for (var property in this.config.options[i].serviceData[0]) {
                                   if (property != "entity_id" && this.config.options[i].serviceData[0].hasOwnProperty(property)) {
                                        //     console.log(property);
                                        //     console.log(this.config.options[i].serviceData[0][property])
                                        var propertyValue = this.config.options[i].serviceData[0][property];
                                        //    console.log(state.attributes);
                                        if (state.attributes[property]) {
                                                 console.log("CURRENT [" + property + "] : " + state.attributes[property]);
                                                 console.log("ELEMENT [" + property + "] : " + propertyValue);
                                             if(property == "brightness")
                                             {
                                                  console.log("LOW: " +(propertyValue - this.config.brightnessTolerance) )
                                                  console.log("HIGH: " +(propertyValue + this.config.brightnessTolerance) )
                                                  if(state.attributes[property] >= (propertyValue - this.config.brightnessTolerance) && state.attributes[property] <= (propertyValue + this.config.brightnessTolerance))
                                                  {
                                                       console.log("IN RANGE")
                                                       console.log("isMatch - Inner 1: " + isMatch);
                                                  }
                                                  else
                                                  {
                                                       console.log("OUT OF RANGE")
                                                       isMatch = false;
                                                  }
                                             }
                                             else if (state.attributes[property] != propertyValue) {
                                                  isMatch = false;
                                             }
                                        } else {
                                             isMatch = false;
                                             //console.log("Cound not find state attribute");
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

     onButtonClick(event) {
          //console.log(event);
          //console.log("Selected Index: " + event.path[0].attributes.selectedIndex.value);
          var target = event.target || event.srcElement;
          var selectedIndex = target.attributes.selectedIndex.value;
          var optionData = this.getOptionData(selectedIndex);
          var serviceData = {};
          if (optionData.serviceData != null) {
               serviceData = optionData.serviceData[0];
          } else {

          }

          // console.log(optionData);
          // console.log(serviceData);
          // console.log("entity: " + this.config.entity);
          serviceData.entity_id = this.config.entity;
          // console.log("DOMAIN: " + this.config.serviceDomain);
          // console.log("SERVICE: " + optionData.service);
          // console.log(optionData);

          this._hass.callService(this.config.serviceDomain, optionData.service, serviceData);

          target.classList.remove("multistate-button-inactive");
          target.classList.add("multistate-button-active");
     }

     getOptionData(selectedIndex) {
          return this.config.options[selectedIndex];
     }



     setConfig(config) {
          //console.log("Set Config called");

          if (!config.serviceDomain) {
               throw new Error('"serviceDomain" not set');
          }

          //config.serviceDomain = config.serviceDomain.toUpperCase();

          if (config.serviceDomain != "SCENE" && !config.entity) {
               throw new Error('"entity" Not Set');
          }

          this.config = config;

          if (this.config.valueTolerance == null) {
               this.config.valueTolerance = 0;
          }


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
          this.config.options.forEach(o => {
               const newButton = document.createElement('div');

               var tempButton = "";
               var id = "";

               id = this.config.baseid + this.i;

               // Build the button 
               newButton.id = id;
               newButton.setAttribute("name", id);
               //newButton.setAttribute("serviceData",JSON.stringify(o));
               newButton.setAttribute("selectedIndex", this.i);


               newButton.setAttribute("class", "multistate-button");
               newButton.innerHTML = o.Name;


               // Attach the button to the DOM

               content.appendChild(newButton);

               //console.log("i: " + this.i);

               newButton.addEventListener('click', event => {
                    this.onButtonClick(event)
               });

               this.i = this.i + 1;

          });

          //content.innerHTML = outputHTML;

          //card.appendChild(content);
          card.appendChild(content);
          card.appendChild(style);
          //    card.addEventListener('click', event => {
          //      console.log(event) });
          root.appendChild(card);

          var i = 0;
          //    this.config.options.forEach(o => {
          //         i++;
          //      var id = this.config.baseid + i;
          //      $("#"+id).click(function() {this.setBrightness(o.Brightness);})
          //      $("#"+id).innerHTML="Test";
          //      //console.log(id);
          //    });

     }



     // The height of your card. Home Assistant uses this to automatically
     // distribute all cards over the available columns.
     getCardSize() {
          return 6;
     }
}

function loadCSS(url) {
     const link = document.createElement('link');
     link.type = 'text/css';
     link.rel = 'stylesheet';
     link.href = url;
     document.head.appendChild(link);
}

function loadJavascript(url) {
     const script = document.createElement('script');
     script.type = 'text/javascript';
     script.src = url;
     document.head.appendChild(script);
}

customElements.define('multi-button-switch', MultiButtonSwitch);