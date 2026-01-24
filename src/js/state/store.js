/**
 * Centralized state management.
 * TODO: Implement state store when migrating components.
 */

class Store {
    constructor() {
        this.state = {
            tasks: [],
            currentUser: null,
            organization: null,
            scores: {}
        };
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.listeners.forEach(listener => listener(this.state));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export const store = new Store();
