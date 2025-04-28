export const AUTH_LOGIN_EVENT = 'auth:login';
export const AUTH_LOGOUT_EVENT = 'auth:logout';

const EventBus = {
    events: {},

    on(eventName, callback) {
      if (typeof callback !== 'function') {
        console.error(`EventBus.on: Callback for event "${eventName}" is not a function.`);
        return;
      }
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      this.events[eventName].push(callback);
      console.log(`EventBus: Listener added for "${eventName}"`);
    },

    dispatch(eventName, data) {
      const eventCallbacks = this.events[eventName];
      if (eventCallbacks && eventCallbacks.length > 0) {
        console.log(`EventBus: Dispatching event "${eventName}" with data:`, data);
        eventCallbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`EventBus: Error in callback for event "${eventName}":`, error);
          }
        });
      } else {
          console.log(`EventBus: No listeners for event "${eventName}"`);
      }
    },

    off(eventName, callbackToRemove) {
      const eventCallbacks = this.events[eventName];
      if (eventCallbacks) {
        this.events[eventName] = eventCallbacks.filter(
          callback => callback !== callbackToRemove
        );
          console.log(`EventBus: Listener removed for "${eventName}"`);
      }
    },
  };

  Object.freeze(EventBus);

  export default EventBus;